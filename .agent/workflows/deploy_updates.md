---
description: Deploy updates to Vercel (Client) and Render (Server)
---

Since your project is set up with Vercel and Render connected to your GitHub repository, deploying updates is triggered effectively by pushing your code to the `main` branch.

1.  **Stage all changes**
    Add all the modified files (Skip/Stop logic, Media Controls, UI Zoom) to the staging area.
    ```bash
    git add .
    ```

2.  **Commit changes**
    Save the changes with a descriptive message.
    ```bash
    git commit -m "feat: Refine Skip/Stop logic, Media Controls, and UI Zoom"
    ```

// turbo
3.  **Push to GitHub**
    Pushing to `main` will automatically trigger:
    -   **Vercel**: Rebuild and deploy the Client.
    -   **Render**: Rebuild and deploy the Server.
    ```bash
    git push origin main
    ```

4.  **Monitor Deployment**
    -   Go to your [Vercel Dashboard](https://vercel.com/dashboard) to check the Client build status.
    -   Go to your [Render Dashboard](https://dashboard.render.com/) to check the Server build status.
