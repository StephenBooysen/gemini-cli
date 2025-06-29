/**
 * @file Defines the route for viewing Markdown documents.
 * @requires express
 * @requires fs.promises
 * @requires path
 * @requires marked
 */
import express from 'express';
const router = express.Router();
import fs from 'fs/promises'; // Using fs.promises
import path from 'path';
import { marked } from 'marked'; // Ensure marked is installed
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contentBaseDir = path.join(__dirname, '..', 'content');

/**
 * Route to display a Markdown file as HTML.
 * It captures the file path from the URL, reads the Markdown file,
 * converts it to HTML using 'marked', and then renders it using the 'document' view.
 * Includes basic security to prevent path traversal.
 *
 * @name GET/*
 * @function
 * @memberof module:routes/view
 * @param {express.Request} req - Express request object. The file path is extracted from `req.params[0]`.
 * @param {express.Response} res - Express response object.
 * @param {express.NextFunction} next - Express next middleware function.
 * @returns {void}
 */
router.get('/*', async (req, res, next) => {
    const filePathParam = req.params[0]; // e.g., "Folder1/MyDoc.md" or "RootFile.md"

    if (!filePathParam) {
        return res.status(400).send('No file path specified.');
    }

    // Basic security: prevent path traversal
    // Normalize the path and ensure it's still within the contentBaseDir
    const requestedFullPath = path.join(contentBaseDir, filePathParam);
    if (!requestedFullPath.startsWith(contentBaseDir + path.sep) && requestedFullPath !== contentBaseDir) {
        // This check is a bit tricky if contentBaseDir itself is requested (e.g. /view/ with no file)
        // For now, we assume filePathParam will always be a file or a path ending in .md
        // A more robust check:
        const resolvedPath = path.resolve(requestedFullPath);
        const resolvedContentBase = path.resolve(contentBaseDir);
        if (!resolvedPath.startsWith(resolvedContentBase)) {
            return res.status(403).send('Access denied: Invalid path.');
        }
    }
     // Further ensure it's a .md file we're trying to access, if that's a strict requirement
    if (path.extname(filePathParam).toLowerCase() !== '.md') {
        // Or, allow viewing other files but don't parse them as markdown
        return res.status(400).send('Invalid file type. Only .md files can be viewed.');
    }


    try {
        const markdownContent = await fs.readFile(requestedFullPath, 'utf-8');
        const htmlContent = marked.parse(markdownContent); // Use marked.parse

        // The layout.ejs expects `directoryTree` in res.locals, which is set by middleware in app.js
        res.render('document', {
            title: path.basename(filePathParam, '.md'), // Use file name as title
            documentHtml: htmlContent,
            // directoryTree is already available via app.use middleware
        });
    } catch (error) {
        if (error.code === 'ENOENT') {
            // Pass to a proper 404 handler if you have one, or render a simple not found page
            // For now, using a specific view for "not found" might be good.
            // res.status(404).send('Document not found.');
            res.status(404);
            res.render('404', {
                title: 'Not Found',
                filePath: filePathParam
                // directoryTree is available
            });

        } else {
            console.error(`Error reading or parsing markdown file ${filePathParam}:`, error);
            next(error); // Pass to global error handler
        }
    }
});

/**
 * Express router for viewing documents.
 * @module routes/view
 */
export default router;
