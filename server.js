import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import expressLayouts from 'express-ejs-layouts';
import { getDirectoryTree } from './services/fileService.js';
import { buildIndex, search } from './services/searchService.js';
import viewRoutes from './routes/view.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

const contentDir = path.join(__dirname, 'content');

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to make directory tree available to all views and build search index once
app.locals.indexBuilt = false;

app.use(async (req, res, next) => {
    try {
        if (!app.locals.directoryTree) {
            console.log('Fetching directory tree for the first time...');
            const tree = await getDirectoryTree(contentDir, contentDir);
            app.locals.directoryTree = tree;
            console.log('Directory tree fetched.');
        }
        res.locals.directoryTree = app.locals.directoryTree;

        if (!app.locals.indexBuilt) {
            console.log('Building search index for the first time...');
            await buildIndex(app.locals.directoryTree);
            app.locals.indexBuilt = true;
            console.log('Search index built.');
        }
        next();
    } catch (error) {
        console.error('Error in initial setup (directory tree/search index):', error);
        next(error);
    }
});

// API Search Route
app.get('/api/search', (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: 'Search query (q) is required.' });
    }
    const results = search(query);
    res.json(results);
});

// View Routes
app.use('/view', viewRoutes);

// Home page route
app.get('/', (req, res) => {
    res.render('index', { title: 'Home' });
});

// 404 Handler
app.use((req, res, next) => {
    res.status(404).render('404', { title: 'Not Found', filePath: req.path });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
