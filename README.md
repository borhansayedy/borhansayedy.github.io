# Publishing this site on GitHub Pages

## 1. Create the repository
1. Go to github.com and sign in (create a free account if you don't have one).
2. Click **New repository**.
3. Name it **exactly** `<your-username>.github.io` — for example, if your username is `borhansayedy`, name the repo `borhansayedy.github.io`.
4. Set it to **Public**, and click **Create repository**.

## 2. Upload the files
1. On the new repo's page, click **Add file → Upload files**.
2. Drag in all the files from this folder: `index.html`, `education.html`, `research.html`, `teaching.html`, `financial-tools.html`, `style.css`, `script.js`.
3. Click **Commit changes**.

## 3. Turn on Pages (usually automatic)
1. Go to the repo's **Settings → Pages**.
2. Under "Build and deployment," make sure the source is set to **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Save. Within a minute or two, your site is live at `https://<your-username>.github.io`.

## Notes for later edits
- **Photo:** the site currently links directly to your photo on the KSU faculty site. It'll keep working as long as that page exists, but for a version you fully control, download the image, add it to the repo (e.g. as `assets/photo.jpg`), and update the `src` in `index.html` to `assets/photo.jpg`.
- **Student feedback:** there are two commented spots (in `index.html` and `teaching.html`) marked for a short "what students say" line — send over your Rate My Professor rating/link whenever you're ready and it can be added.
- **Retirement planning calculator:** `financial-tools.html` has a placeholder card for this — send the details whenever you're ready and it'll be built out like the other two calculators.
- **Custom `.io` domain:** if you later buy an actual `.io` domain, add a file named `CNAME` (no extension) containing just your domain name, and point your domain's DNS to GitHub Pages. No other changes needed.
