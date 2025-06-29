const express = require('express');
const path = require('path');
const fs = require('fs').promises; // Added fs.promises
const marked = require('marked'); // Added marked
const fileService = require('./services/fileService');
const searchService = require('./services/searchService');

const app = express();
const port = process.env.PORT || 3000;

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Content directory
const contentDir = path.join(__dirname, 'content');

// Global variable to store the directory tree and flag for initialization
// Initialize with a default structure to prevent errors if initialization fails
let siteDirectoryTree = {
    name: path.basename(contentDir),
    path: contentDir,
    type: 'folder',
    children: [],
    relativePath: ''
};
let isInitialized = false;

// Function to initialize directory tree and search index
async function initializeApp() {
    if (isInitialized) return; // Prevent re-initialization

    try {
        console.log("Initializing application data...");
        // Perform operations on a temporary tree first
        const tempTree = await fileService.getDirectoryTree(contentDir);

        // Function to make paths relative to contentDir for links (mutates the tree)
        // This function needs to be defined here or accessible in this scope
        function makePathsRelative(node, baseDir) {
            if (node.path) {
                node.relativePath = path.relative(baseDir, node.path);
            }
            if (node.children) {
                node.children.forEach(child => makePathsRelative(child, baseDir));
            }
        }
        makePathsRelative(tempTree, contentDir);

        // Build the search index using the processed tree
        await searchService.buildIndex(tempTree);

        // If all operations succeed, assign the fully processed tree to the global variable
        siteDirectoryTree = tempTree;
        isInitialized = true;
        console.log("Application data initialized successfully.");
    } catch (error) {
        console.error("Fatal error during app initialization:", error);
        // siteDirectoryTree retains its default initialized value (empty but valid tree).
        // isInitialized remains false, indicating that the full initialization was not successful.
        // The application will run with an empty navigation but won't crash the template.
    }
}

// Middleware to make directory tree available to all requests
app.use((req, res, next) => {
    if (!isInitialized) {
        // Could render a "initializing" page or wait, but for now, just proceed.
        // It might mean the first few requests don't have the tree if initialization is slow.
        // A better approach for production would be to ensure initialization completes before listening.
        console.warn("App not fully initialized when request came in.");
    }
    res.locals.directoryTree = siteDirectoryTree;
    next();
});


// Routes
// Index page - will display navigation and a welcome message or root readme
app.get('/', async (req, res) => { // Made route async
    let defaultContentHtml = null;
    const defaultFilesToTry = ['GettingStarted.md', 'index.md', 'README.md'];
    let foundFile = null;

    for (const fileName of defaultFilesToTry) {
        const filePath = path.join(contentDir, fileName);
        try {
            await fs.access(filePath); // Check if file exists and is accessible
            const markdownContent = await fs.readFile(filePath, 'utf-8');
            defaultContentHtml = marked.parse(markdownContent);
            foundFile = fileName;
            console.log(`Successfully loaded ${fileName} for the home page.`);
            break; // Stop after finding the first available default file
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log(`Default file ${fileName} not found in content directory. Trying next...`);
            } else {
                console.error(`Error accessing or reading ${fileName}:`, error);
            }
        }
    }

    if (!foundFile) {
        console.log('No default content file (GettingStarted.md, index.md, or README.md) found in content directory.');
    }

    res.render('index', {
        title: 'Home',
        defaultContentHtml: defaultContentHtml, // Pass HTML to the template
        // directoryTree is already in res.locals
    });
});

// Placeholder for document view route (will be in a separate file later)
const viewRoutes = require('./routes/view');
app.use('/view', viewRoutes);

// Search API endpoint
app.get('/api/search', (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: 'Query parameter "q" is required.' });
    }
    try {
        const results = searchService.search(query);
        // results are like: [{ path: 'relativePath', name: 'Document Name', score: 0.567 }]
        res.json(results);
    } catch (error) {
        console.error("Error in search API:", error);
        res.status(500).json({ error: 'Search failed.' });
    }
});


// Start the server after initialization
async function startServer() {
    await initializeApp(); // Ensure initialization is complete
    app.listen(port, () => {
        console.log(`Server listening at http://localhost:${port}`);
    });
}

startServer();

module.exports = app; // For potential testing
