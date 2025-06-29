/**
 * @file Service for building and querying a search index using Lunr.js.
 * @requires lunr
 * @requires fs.promises
 * @requires path
 */
import lunr from 'lunr'; // Changed to ES6 import
import fs from 'fs/promises'; // Changed to ES6 import
import path from 'path'; // Changed to ES6 import

/**
 * The Lunr.js search index instance.
 * @type {lunr.Index | undefined}
 */
let idx;

/**
 * A map storing document details by their reference ID (relative path).
 * Used to retrieve original document information after a search.
 * @type {object<string, {id: string, name: string, content: string}>}
 */
let documentMap = {}; // Maps document refs (like relative paths) to their original content/title

/**
 * Information about a Markdown file.
 * @typedef {object} MarkdownFileInfo
 * @property {string} path - The full path to the Markdown file.
 * @property {string} relativePath - The path to the Markdown file relative to the content directory.
 */

/**
 * Recursively fetches all Markdown file paths from a directory tree structure.
 * @async
 * @function getAllMarkdownFiles
 * @param {module:services/fileService.DirectoryTreeNode} node The current node in the directory tree.
 * @param {string} [currentPath=''] The current relative path (used internally for recursion).
 * @returns {Promise<MarkdownFileInfo[]>} A promise that resolves to an array of objects,
 *                                       each containing the `path` and `relativePath` of a Markdown file.
 */
async function getAllMarkdownFiles(node, currentPath = '') {
  let files = [];
  if (node.type === 'file' && node.name.endsWith('.md')) {
    // node.path is already the full path from fileService
    // node.relativePath is relative to contentDir
    files.push({
      path: node.path,
      relativePath: node.relativePath || node.name,
    });
  }
  if (node.children) {
    for (const child of node.children) {
      files = files.concat(await getAllMarkdownFiles(child));
    }
  }
  return files;
}

/**
 * Represents a document to be indexed by Lunr.
 * @typedef {object} LunrDocument
 * @property {string} id - The unique identifier for the document (relative path).
 * @property {string} name - The name of the document (typically the filename without extension).
 * @property {string} content - The full text content of the document.
 */

/**
 * Builds the Lunr.js search index from Markdown files found in the directory tree.
 * It reads each Markdown file, creates a document object, and adds it to the index.
 * The `documentMap` is also populated for later retrieval of document details.
 * @async
 * @function buildIndex
 * @param {module:services/fileService.DirectoryTreeNode} directoryTree The directory tree structure containing Markdown files.
 * @returns {Promise<void>} A promise that resolves when the index is built.
 */
async function buildIndex(directoryTree) {
  console.log('Starting to build search index...');
  const documents = [];
  documentMap = {}; // Reset map

  const markdownFiles = await getAllMarkdownFiles(directoryTree);

  for (const fileInfo of markdownFiles) {
    try {
      const content = await fs.readFile(fileInfo.path, 'utf-8');
      const doc = {
        id: fileInfo.relativePath, // Use relative path as unique ID
        name: path.basename(fileInfo.relativePath, '.md'),
        content: content,
      };
      documents.push(doc);
      documentMap[fileInfo.relativePath] = doc; // Store for easy lookup
    } catch (error) {
      console.error(`Error reading file ${fileInfo.path} for indexing:`, error);
    }
  }

  idx = lunr(function() {
    // eslint-disable-next-line no-invalid-this
    this.ref('id'); // Document reference, our relativePath
    // eslint-disable-next-line no-invalid-this
    this.field('name', { boost: 10 }); // Boost matches in title
    // eslint-disable-next-line no-invalid-this
    this.field('content');

    documents.forEach(function(doc) {
      // eslint-disable-next-line no-invalid-this
      this.add(doc);
    }, this);
  });
  console.log(`Search index built. ${documents.length} documents indexed.`);
}

/**
 * Represents a search result.
 * @typedef {object} SearchResult
 * @property {string} path - The relative path of the found document.
 * @property {string} name - The name of the found document.
 * @property {number} score - The Lunr.js score for the search result.
 */

/**
 * Searches the built Lunr.js index for a given query.
 * @function search
 * @param {string} query The search query string.
 * @returns {SearchResult[]} An array of search results, each containing the path, name, and score.
 *                           Returns an empty array if the index is not built or if an error occurs.
 */
function search(query) {
  if (!idx) {
    console.warn('Search index not built yet.');
    return [];
  }
  try {
    const results = idx.search(query);
    // Map results back to original document details if needed (e.g., for snippets or full titles)
    return results.map((result) => {
      const doc = documentMap[result.ref];
      return {
        path: result.ref, // This is the relativePath
        name: doc ? doc.name : result.ref, // Fallback to ref if not in map (shouldn't happen)
        score: result.score,
        // To include snippets, Lunr needs extra setup or client-side processing
        // For now, just returning path and name.
      };
    });
  } catch (error) {
    // Handle cases where Lunr might throw error on certain query syntax if not robust
    console.error('Error during search:', error);
    return [];
  }
}

/**
 * @module services/searchService
 * @description Provides functionalities to build a search index and perform searches on documents.
 */
export {
  // Changed to ES6 export
  buildIndex,
  search,
};
