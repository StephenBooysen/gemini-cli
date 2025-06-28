const express = require('express');
const path = require('path');
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
let siteDirectoryTree = null;
let isInitialized = false;

// Function to initialize directory tree and search index
async function initializeApp() {
    if (isInitialized) return;
    try {
        console.log("Initializing application data...");
        siteDirectoryTree = await fileService.getDirectoryTree(contentDir);

        // Function to make paths relative to contentDir for links (mutates the tree)
        function makePathsRelative(node, baseDir) {
            if (node.path) {
                node.relativePath = path.relative(baseDir, node.path);
            }
            if (node.children) {
                node.children.forEach(child => makePathsRelative(child, baseDir));
            }
        }
        makePathsRelative(siteDirectoryTree, contentDir);

        // Build the search index using the processed tree
        // searchService.buildIndex needs the tree structure that includes relative paths
        await searchService.buildIndex(siteDirectoryTree);

        isInitialized = true;
        console.log("Application data initialized successfully.");
    } catch (error) {
        console.error("Fatal error during app initialization:", error);
        // Depending on the severity, you might want to exit or disable features
        // For now, we'll log it. The app might run without nav/search if this fails.
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
app.get('/', (req, res) => {
    // For now, just render index. It will use res.locals.directoryTree for nav
    res.render('index', {
        title: 'Home',
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
