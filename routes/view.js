const express = require('express');
const router = express.Router();
const fs = require('fs').promises; // Using fs.promises
const path = require('path');
const marked = require('marked'); // Ensure marked is installed

const contentBaseDir = path.join(__dirname, '..', 'content');

// Route to display a markdown file
// The '*' will capture the full file path including subdirectories
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

module.exports = router;
