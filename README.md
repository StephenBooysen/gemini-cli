# Markdown Editor GitHub Tool (Node.js)

This CLI tool allows users to clone a GitHub repository, list its markdown files, select a file to edit in their default system editor, and then commit and push the changes back to the GitHub repository.

## Features

-   **Clone or Pull Repositories:**
    -   Clones a new repository if the specified local directory is empty or doesn't exist.
    -   Pulls the latest changes if the local directory is an existing Git repository.
-   **List Markdown Files:** Displays a list of all `.md` files found in the repository.
-   **Interactive File Selection:** Allows the user to choose a markdown file from the list.
-   **Open in Default Editor:** Opens the selected markdown file using the system's default application for `.md` files.
-   **Commit Changes:**
    -   Prompts the user to confirm they've saved changes.
    -   Asks for a commit message.
    -   Commits the selected file (or any staged changes if the selected file wasn't modified but other changes were staged).
-   **Push Changes:** Pushes the committed changes to the `origin` remote on the current branch (will attempt to set upstream for the first push).
-   **User-Friendly Prompts:** Guides the user through the workflow using interactive CLI prompts.
-   **Error Handling:** Provides feedback for common Git errors (e.g., unconfigured user, authentication issues, need to pull).

## Prerequisites

1.  **Node.js and npm:** Ensure you have a recent version of Node.js installed (which includes npm). You can download it from [nodejs.org](https://nodejs.org/).
2.  **Git:** The Git command-line tool must be installed and accessible in your system's PATH. You can download it from [git-scm.com](https://git-scm.com/).
    *   **Git User Configuration:** It's highly recommended to configure your Git user name and email globally if you haven't already. This is required for making commits:
        ```bash
        git config --global user.name "Your Name"
        git config --global user.email "youremail@example.com"
        ```
3.  **Default Markdown Editor:** Your operating system should have a default application associated with `.md` files for them to be opened automatically.

## Setup

1.  **Clone this Tool's Repository (or Download Files):**
    ```bash
    # If you have this project in a git repo:
    # git clone <this-tool-repo-url>
    # cd <this-tool-directory>

    # Or, if you just have the app.js and package.json:
    # Ensure app.js and package.json are in your current directory.
    ```
2.  **Navigate to the Project Directory:**
    Open your terminal or command prompt and change to the directory where you placed the tool's files (e.g., where `app.js` and `package.json` are).
3.  **Install Dependencies:**
    Run the following command to install the necessary Node.js packages:
    ```bash
    npm install
    ```

## Usage

1.  **Run the Application:**
    Execute the script using Node.js:
    ```bash
    node app.js
    ```
2.  **Follow Prompts:**
    *   **Repository URL:** Enter the HTTPS or SSH URL of the GitHub repository you want to work with.
    *   **Local Path:** Specify a local directory where the repository will be cloned or where the existing clone resides. A default path (`./cloned_repo_nodejs`) is suggested.
    *   The tool will then clone or pull the repository.
    *   **Select File:** If markdown files are found, they will be listed. Select the one you wish to edit using the arrow keys and press Enter.
    *   The selected file will open in your default markdown editor.
    *   **Edit and Save:** Make your changes in the editor and save the file.
    *   **Confirm Commit:** Back in the terminal, confirm if you have saved your changes and are ready to commit.
    *   **Commit Message:** If you confirm, you'll be prompted to enter a commit message.
    *   The tool will then attempt to commit and push your changes.
    *   Follow any further instructions or error messages provided by the tool.

## Dependencies Used

-   `simple-git`: For programmatically executing Git commands.
-   `inquirer`: For creating interactive command-line user prompts.
-   `fs-extra`: For file system operations (like ensuring a directory exists).
-   `open`: For opening files with the system's default application.

---

If you encounter issues, ensure your Git setup (authentication, configuration) is correct and that you have permissions for the target repository.
