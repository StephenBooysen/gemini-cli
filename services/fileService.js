const fs = require('fs').promises; // Using fs.promises
const path = require('path');

async function getDirectoryTree(dirPath) {
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
            tree.children.push(await getDirectoryTree(itemPath));
        } else if (itemStats.isFile() && path.extname(item).toLowerCase() === '.md') {
            tree.children.push({
                name: item,
                path: itemPath, // Store the full path relative to project root or content dir
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

module.exports = {
    getDirectoryTree
};
