const lunr = require('lunr');
const fs = require('fs').promises;
const path = require('path');

// In-memory store for the Lunr index and document map
let idx;
let documentMap = {}; // Maps document refs (like relative paths) to their original content/title

// Function to recursively fetch all markdown file paths from the directory tree
async function getAllMarkdownFiles(node, currentPath = '') {
    let files = [];
    if (node.type === 'file' && node.name.endsWith('.md')) {
        // node.path is already the full path from fileService
        // node.relativePath is relative to contentDir
        files.push({ path: node.path, relativePath: node.relativePath || node.name });
    }
    if (node.children) {
        for (const child of node.children) {
            files = files.concat(await getAllMarkdownFiles(child));
        }
    }
    return files;
}


async function buildIndex(directoryTree) {
    console.log("Starting to build search index...");
    const documents = [];
    documentMap = {}; // Reset map

    const markdownFiles = await getAllMarkdownFiles(directoryTree);

    for (const fileInfo of markdownFiles) {
        try {
            const content = await fs.readFile(fileInfo.path, 'utf-8');
            const doc = {
                id: fileInfo.relativePath, // Use relative path as unique ID
                name: path.basename(fileInfo.relativePath, '.md'),
                content: content
            };
            documents.push(doc);
            documentMap[fileInfo.relativePath] = doc; // Store for easy lookup
        } catch (error) {
            console.error(`Error reading file ${fileInfo.path} for indexing:`, error);
        }
    }

    idx = lunr(function () {
        this.ref('id'); // Document reference, our relativePath
        this.field('name', { boost: 10 }); // Boost matches in title
        this.field('content');

        // Optionally, add metadata if needed for display
        // this.metadataWhitelist = ['position']

        documents.forEach(function (doc) {
            this.add(doc);
        }, this);
    });
    console.log(`Search index built. ${documents.length} documents indexed.`);
}

function search(query) {
    if (!idx) {
        console.warn("Search index not built yet.");
        return [];
    }
    try {
        const results = idx.search(query);
        // Map results back to original document details if needed (e.g., for snippets or full titles)
        return results.map(result => {
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
        console.error("Error during search:", error);
        return [];
    }
}

module.exports = {
    buildIndex,
    search
};
