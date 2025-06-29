// Main application script for the Markdown Editor GitHub Tool (Node.js)

/**
 * @file Main application script for the Markdown Editor GitHub Tool.
 * @description This script handles cloning a GitHub repository, listing markdown files,
 * allowing the user to select and edit a file, and then committing and pushing the changes.
 * @requires simple-git
 * @requires fs-extra
 * @requires path
 * @requires inquirer
 * @requires open
 */

import simpleGit from 'simple-git';
import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import open from 'open';

const git = simpleGit();

/**
 * Clones a Git repository to a specified local path.
 * If the directory exists and is not empty, it assumes the repository is already cloned.
 * @async
 * @function cloneRepo
 * @param {string} repoUrl The URL of the Git repository to clone.
 * @param {string} localPath The local filesystem path where the repository should be cloned.
 * @returns {Promise<void>} A promise that resolves when the cloning is complete or if the directory already exists and is not empty.
 * @throws {Error} If cloning fails.
 */
async function cloneRepo(repoUrl, localPath) {
  try {
    const CWD = process.cwd();
    const targetPath = path.resolve(CWD, localPath);

    if (
      (await fs.pathExists(targetPath)) &&
      (await fs.readdir(targetPath)).length > 0
    ) {
      console.log(
        `Directory ${targetPath} already exists and is not empty. Assuming it's the repo.`
      );
      return;
    }

    console.log(`Cloning ${repoUrl} into ${targetPath}...`);
    await git.clone(repoUrl, targetPath);
    console.log('Repository cloned successfully.');
  } catch (error) {
    console.error(`Error cloning repository: ${error.message}`);
    throw error;
  }
}

/**
 * Pulls the latest changes from the remote repository for a local Git repository.
 * @async
 * @function pullRepo
 * @param {string} localPath The local filesystem path of the Git repository.
 * @returns {Promise<void>} A promise that resolves when the pull operation is complete.
 * @throws {Error} If the path is not a git repository or if pulling fails.
 */
async function pullRepo(localPath) {
  try {
    const CWD = process.cwd();
    const targetPath = path.resolve(CWD, localPath);

    if (!(await fs.pathExists(path.join(targetPath, '.git')))) {
      console.error(`Error: ${targetPath} is not a git repository.`);
      return;
    }

    console.log(`Pulling latest changes for repository at ${targetPath}...`);
    await simpleGit(targetPath).pull();
    console.log('Repository up to date.');
  } catch (error) {
    console.error(`Error pulling repository: ${error.message}`);
    throw error;
  }
}

/**
 * Recursively lists all Markdown (.md) files in a given directory, excluding the .git directory.
 * @async
 * @function listMarkdownFiles
 * @param {string} basePath The base path of the directory to scan. Paths returned will be relative to this base path.
 * @returns {Promise<string[]>} A promise that resolves with an array of relative file paths to the Markdown files found.
 *                               Returns an empty array if the directory does not exist or if an error occurs.
 */
async function listMarkdownFiles(basePath) {
  const mdFiles = [];
  const CWD = process.cwd();
  const absoluteBasePath = path.resolve(CWD, basePath);

  /**
   * Helper function to recursively find markdown files.
   * @async
   * @param {string} currentPath The current directory path to scan.
   * @returns {Promise<void>}
   */
  async function findFiles(currentPath) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullEntryPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '.git') {
          continue;
        }
        await findFiles(fullEntryPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        mdFiles.push(path.relative(absoluteBasePath, fullEntryPath));
      }
    }
  }

  try {
    if (!(await fs.pathExists(absoluteBasePath))) {
      console.error(`Error: Directory ${absoluteBasePath} does not exist.`);
      return [];
    }
    await findFiles(absoluteBasePath);
    return mdFiles;
  } catch (error) {
    console.error(`Error listing markdown files: ${error.message}`);
    return [];
  }
}

/**
 * Stages specified files and commits them to the local Git repository.
 * @async
 * @function commitChanges
 * @param {string} localPath The absolute path to the local repository.
 * @param {string} message The commit message.
 * @param {string[]} [filesToAdd=[]] An array of file paths (relative to the repository root) to add to the staging area before committing.
 *                                    If empty or not provided, commits currently staged changes.
 * @returns {Promise<void>} A promise that resolves when the changes are committed.
 * @throws {Error} If committing fails (e.g., Git user not configured, no changes to commit).
 */
async function commitChanges(localPath, message, filesToAdd) {
  try {
    console.log(`Attempting to commit changes in ${localPath}...`);
    const repoGit = simpleGit(localPath);

    if (filesToAdd && filesToAdd.length > 0) {
      for (const file of filesToAdd) {
        await repoGit.add(file);
        console.log(`Added ${file} to staging area.`);
      }
    } else {
      console.log(
        'No specific files provided to add. Committing existing staged changes if any.'
      );
    }

    const statusAfterAdd = await repoGit.status();
    if (statusAfterAdd.staged.length === 0) {
      console.log(
        "No changes were staged for commit. This might happen if the file wasn't modified or saved."
      );
    }

    await repoGit.commit(message);
    console.log(`Changes committed with message: "${message}"`);
  } catch (error) {
    console.error(`Error committing changes: ${error.message}`);
    if (
      error.message.includes('Please tell me who you are') ||
      error.message.includes('user.name') ||
      error.message.includes('user.email')
    ) {
      console.error('\nGit user identity (name and email) is not configured.');
      console.error(
        'Please configure it using the following commands and try again:'
      );
      console.error('  git config --global user.name "Your Name"');
      console.error('  git config --global user.email "youremail@example.com"');
    } else if (error.message.includes('nothing to commit')) {
      console.warn(
        'Commit failed: Nothing to commit. Ensure your file was saved and changed, or that there were other staged changes.'
      );
    }
    throw error;
  }
}

/**
 * Pushes committed changes from the local repository to the remote 'origin'.
 * It attempts to push the current branch and set upstream if not already set.
 * @async
 * @function pushChanges
 * @param {string} localPath The absolute path to the local repository.
 * @returns {Promise<void>} A promise that resolves when the changes are pushed successfully.
 * @throws {Error} If pushing fails (e.g., no internet, authentication issues, remote has new changes).
 */
async function pushChanges(localPath) {
  try {
    console.log(`Pushing changes from ${localPath} to remote...`);
    const repoGit = simpleGit(localPath);

    const status = await repoGit.status();
    const currentBranch = status.current;

    if (!currentBranch) {
      console.error('Could not determine the current branch. Cannot push.');
      throw new Error(
        'Current branch could not be determined for push operation.'
      );
    }

    console.log(`Pushing to remote 'origin' branch '${currentBranch}'...`);
    await repoGit.push('origin', currentBranch, ['--set-upstream']);
    console.log('Changes pushed successfully.');
  } catch (error) {
    console.error(`Error pushing changes: ${error.message}`);
    console.error('\nPushing failed. Common reasons include:');
    console.error('  - No internet connection.');
    console.error(
      '  - Incorrect repository URL or insufficient permissions (authentication failed).'
    );
    console.error(
      '    (Ensure your PAT or SSH key is correctly set up with GitHub/your Git provider).'
    );
    console.error(
      '  - Remote repository has new changes you need to pull first (run `git pull` manually or re-run the tool to pull).'
    );
    console.error(
      '  - The local branch does not have a tracking relationship with a remote branch (the `--set-upstream` flag attempts to fix this for the first push).'
    );
    throw error;
  }
}

/**
 * Main function to orchestrate the application workflow.
 * It prompts the user for repository URL and local path, clones/pulls the repository,
 * lists Markdown files, allows selection for editing, and then handles committing and pushing changes.
 * @async
 * @function main
 */
async function main() {
  console.log('Welcome to the Markdown Editor GitHub Tool (Node.js)!');

  const questions = [
    {
      type: 'input',
      name: 'repoUrl',
      message: 'Enter the GitHub repository URL:',
      /**
       * Validates the repository URL.
       * @param {string} value The input value.
       * @returns {boolean|string} True if valid, or an error message string.
       */
      validate: function(value) {
        if (
          value.length &&
          (value.startsWith('http://') ||
            value.startsWith('https://') ||
            value.startsWith('git@'))
        ) {
          return true;
        }
        return 'Please enter a valid repository URL.';
      },
    },
    {
      type: 'input',
      name: 'localPath',
      message:
        'Enter the local directory path for the clone (e.g., ./my-repo):',
      default: './cloned_repo_nodejs',
      /**
       * Validates the local path.
       * @param {string} value The input value.
       * @returns {boolean|string} True if valid, or an error message string.
       */
      validate: function(value) {
        if (value.length) {
          return true;
        }
        return 'Please enter a local path.';
      },
    },
  ];

  const answers = await inquirer.prompt(questions);
  const { repoUrl, localPath } = answers;
  const absoluteLocalPath = path.resolve(process.cwd(), localPath);

  try {
    console.log(`Using repository URL: ${repoUrl}`);
    console.log(`Using local path: ${absoluteLocalPath}`);

    await fs.ensureDir(absoluteLocalPath);
    console.log(`Ensured directory exists: ${absoluteLocalPath}`);

    const gitDirExists = await fs.pathExists(
      path.join(absoluteLocalPath, '.git')
    );

    if (gitDirExists) {
      console.log('Repository seems to exist locally. Pulling updates...');
      await pullRepo(absoluteLocalPath);
    } else {
      const filesInDir = await fs.readdir(absoluteLocalPath);
      if (filesInDir.length > 0) {
        const { confirmClone } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmClone',
            message: `Directory ${absoluteLocalPath} is not empty and not a git repo. Clone into it anyway? (This might overwrite existing files if they conflict with repo files)`,
            default: false,
          },
        ]);
        if (!confirmClone) {
          console.log('Cloning aborted by user.');
          return;
        }
      }
      console.log('Cloning repository...');
      await cloneRepo(repoUrl, absoluteLocalPath);
    }

    const markdownFiles = await listMarkdownFiles(absoluteLocalPath);
    if (markdownFiles.length > 0) {
      console.log('\nFound Markdown files:');
      markdownFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file}`);
      });

      const { selectedFile } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedFile',
          message: 'Select a markdown file to edit:',
          choices: markdownFiles,
          /**
           * Filters the selected file value.
           * @param {string} val The input value.
           * @returns {string} The filtered value.
           */
          filter: function(val) {
            return val;
          },
        },
      ]);

      if (selectedFile) {
        const fullFilePath = path.join(absoluteLocalPath, selectedFile);
        console.log(`Opening ${fullFilePath}...`);
        try {
          await open(fullFilePath);
          console.log(
            `File ${selectedFile} opened. Please edit and save it using your default markdown editor.`
          );

          const { readyToCommit } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'readyToCommit',
              message:
                'Have you saved your changes and are you ready to commit them?',
              default: true,
            },
          ]);

          if (readyToCommit) {
            const { commitMessage } = await inquirer.prompt([
              {
                type: 'input',
                name: 'commitMessage',
                message: 'Enter your commit message:',
                /**
                 * Validates the commit message.
                 * @param {string} value The input value.
                 * @returns {boolean|string} True if valid, or an error message string.
                 */
                validate: function(value) {
                  if (value.trim().length > 0) {
                    return true;
                  }
                  return 'Please enter a commit message.';
                },
              },
            ]);

            await commitChanges(absoluteLocalPath, commitMessage, [
              selectedFile,
            ]);
            await pushChanges(absoluteLocalPath);
          } else {
            console.log('Commit and push aborted by user.');
          }
        } catch (openError) {
          console.error(`Error opening file ${selectedFile}:`, openError);
        }
      }
    } else {
      console.log('No Markdown files found in the repository.');
    }
  } catch (error) {
    console.error('An error occurred in the main workflow:', error.message);
  }
}

main().catch(console.error);
