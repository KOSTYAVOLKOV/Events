# Amsterdam Events starter

A dependency-free Vercel static page, serverless API, and Scriptable iPhone widget.

## Run and deploy

1. Copy these files into the intended repository after reviewing its current contents.
2. Install/use the Vercel CLI and run `vercel dev`, or import the repository into Vercel.
3. Deploy, then set `API_URL` and the widget's destination URL in `scriptable/AmsterdamEvents.js` to the deployed domain.
4. In Scriptable, create a script with that file's contents and add a medium widget.

## Data-source status

- **Jazz in Amsterdam:** the API handler consumes the documented public JSON endpoint with `calendar=jazzAmsterdam&page=1&archive=false` and maps its event fields.
- **Art Ahead:** the site's own footer links to the public RSS feed at `https://artahead.nl/feed.xml`. The API reads that feed and keeps Amsterdam listings. RSS item date/location markup may change; the adapter extracts dates when present and preserves entries as `Date TBA` when the feed omits them.
- **Resident Advisor:** the public Amsterdam listings page is linked, but no permitted public event API/feed was verified. No private endpoints, browser impersonation, or scraping is used.

The page displays only events returned by the active feeds; it has no demo events. Resident Advisor remains link-only until a permitted public feed/API is verified.
