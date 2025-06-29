/**
 * @file Service for file system operations, primarily for generating a directory tree.
 * @requires fs.promises
 * @requires path
 */
import fs from 'fs/promises'; // Using fs.promises
import path from 'path';

/**
 * Represents a node in the directory tree.
 * @typedef {object} DirectoryTreeNode
 * @property {string} name - The name of the file or folder.
 * @property {string} path - The full path to the file or folder.
 * @property {'folder'|'file'} type - The type of the node.
 * @property {DirectoryTreeNode[]} [children] - For folders, an array of child nodes.
 */

/**
 * Asynchronously generates a tree structure for a given directory path.
 * It lists all files and subdirectories, focusing on Markdown files.
 * Hidden files (starting with '.') are ignored.
 * Children are sorted with folders first, then files, both alphabetically.
 *
 * @async
 * @function getDirectoryTree
 * @param {string} dirPath - The path to the directory to scan.
 * @param {string} contentBaseDir - The base directory for content, used to calculate relative paths.
 * @returns {Promise<DirectoryTreeNode>} A promise that resolves to an object representing the directory tree.
 * @throws {Error} If the path is not a directory or if other file system errors occur (excluding ENOENT on initial dirPath scan).
 */
async function getDirectoryTree(dirPath, contentBaseDir) {
    let stats;
    try {
        stats = await fs.stat(dirPath);
    } catch (error) {
        // If path does not exist or is not accessible
        if (error.code === 'ENOENT') {
            console.warn(`Directory not found: ${dirPath}. Returning empty for this path.`);
            // Return a structure indicating it's a folder but with no children,
            // or handle as an error depending on desired behavior.
            // For now, let's assume it might be an empty content dir, so create a base tree.
            return {
                name: path.basename(dirPath),
                path: dirPath,
                type: 'folder',
                children: []
            };
        }
        throw error; // Re-throw other errors
    }

    if (!stats.isDirectory()) {
        throw new Error(`Path is not a directory: ${dirPath}`);
    }

    const items = await fs.readdir(dirPath);
    const tree = {
        name: path.basename(dirPath),
        path: dirPath,
        type: 'folder',
        children: []
    };

    for (const item of items) {
        // Ignore .gitkeep or other hidden files if necessary
        if (item.startsWith('.')) {
            continue;
        }
        const itemPath = path.join(dirPath, item);
        let itemStats;
        try {
            itemStats = await fs.stat(itemPath);
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.warn(`File/directory not found during scan: ${itemPath}. Skipping.`);
                continue; // Skip this item if it disappeared during scan
            }
            throw error;
        }


        if (itemStats.isDirectory()) {
            tree.children.push(await getDirectoryTree(itemPath, contentBaseDir));
        } else if (itemStats.isFile() && path.extname(item).toLowerCase() === '.md') {
            const relativePath = path.relative(contentBaseDir, itemPath);
            tree.children.push({
                name: item,
                path: itemPath, // Store the full path
                relativePath: relativePath, // Store the path relative to contentBaseDir
                type: 'file'
            });
        }
    }
    // Sort children: folders first, then files, then alphabetically
    tree.children.sort((a, b) => {
        if (a.type === b.type) {
            return a.name.localeCompare(b.name);
        }
        return a.type === 'folder' ? -1 : 1;
    });
    return tree;
}

/**
 * @module services/fileService
 * @description Provides file system utility functions.
 */
export {
    getDirectoryTree
};
