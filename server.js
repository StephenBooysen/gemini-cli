import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import expressEjsLayouts from 'express-ejs-layouts';
import { getDirectoryTree } from './services/fileService.js';
import viewRoutes from './routes/view.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Define content directory
const contentDir = path.join(__dirname, 'content');

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressEjsLayouts);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to make directory tree available to all views
app.use(async (req, res, next) => {
    try {
        res.locals.directoryTree = await getDirectoryTree(contentDir, contentDir);
        next();
    } catch (error) {
        console.error('Error fetching directory tree:', error);
        next(error);
    }
});

// Routes
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
