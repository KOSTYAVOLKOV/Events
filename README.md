# Amsterdam Events starter

A dependency-free Vercel static page, serverless API, and Scriptable iPhone widget.

## Run and deploy

1. Copy these files into the intended repository after reviewing its current contents.
2. Install/use the Vercel CLI and run `vercel dev`, or import the repository into Vercel.
3. Deploy, then set `API_URL` and the widget's destination URL in `scriptable/AmsterdamEvents.js` to the deployed domain.
4. In Scriptable, create a script with that file's contents and add a medium widget.

## Data-source status

- **Jazz in Amsterdam:** the site publicly documents `https://jazzin.amsterdam/api`. The API handler consumes that public endpoint and normalizes common event fields. Its exact schema could not be independently fetched in this environment, so verify the response shape before relying on this connector.
- **Art Ahead:** public event listings are visible at `https://artahead.nl`, but no supported public API or feed was verified. Kept as a source link; no HTML scraping is enabled.
- **Resident Advisor:** the public Amsterdam listings page is linked, but no permitted public event API/feed was verified. No private endpoints, browser impersonation, or scraping is used.

The page displays only events actually returned by the Jazz API; it has no demo events. Incomplete sources are deliberately shown as links rather than represented as connected.
