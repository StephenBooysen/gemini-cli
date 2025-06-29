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
 * @name GET/*
 * @function
 * @memberof module:routes/view
 * @param {express.Request} req Express request object. The file path is extracted from `req.params[0]`.
 * @param {express.Response} res Express response object.
 * @param {express.NextFunction} next Express next middleware function.
 * @returns {void}
 */
// eslint-disable-next-line new-cap
router.get('/*', async (req, res, next) => {
  const filePathParam = req.params[0];

  if (!filePathParam) {
    return res.status(400).send('No file path specified.');
  }

  // Basic security: prevent path traversal
  // Normalize the path and ensure it's still within the contentBaseDir
  const requestedFullPath = path.join(contentBaseDir, filePathParam);

  const resolvedPath = path.resolve(requestedFullPath);
  const resolvedContentBase = path.resolve(contentBaseDir);
  if (!resolvedPath.startsWith(resolvedContentBase)) {
    return res.status(403).send('Access denied: Invalid path.');
  }

  if (path.extname(filePathParam).toLowerCase() !== '.md') {
    return res
      .status(400)
      .send('Invalid file type. Only .md files can be viewed.');
  }

  try {
    const markdownContent = await fs.readFile(requestedFullPath, 'utf-8');
    const htmlContent = marked.parse(markdownContent);

    res.render('document', {
      title: path.basename(filePathParam, '.md'),
      documentHtml: htmlContent,
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404);
      res.render('404', {
        title: 'Not Found',
        filePath: filePathParam,
      });
    } else {
      console.error(
        `Error reading or parsing markdown file ${filePathParam}:`,
        error
      );
      next(error);
    }
  }
});

/**
 * Express router for viewing documents.
 * @module routes/view
 */
export default router;
