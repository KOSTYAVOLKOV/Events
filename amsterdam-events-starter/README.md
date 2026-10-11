# Amsterdam Events starter

A dependency-free Vercel static page, serverless API, and Scriptable iPhone widget.

## Run and deploy

1. Copy these files into the intended repository after reviewing its current contents.
2. Install/use the Vercel CLI and run `vercel dev`, or import the repository into Vercel.
3. Deploy, then set `API_URL` and the widget's destination URL in `scriptable/AmsterdamEvents.js` to the deployed domain.
4. In Scriptable, create a script with that file's contents and add a medium widget.

## Data-source status

- **Jazz in Amsterdam:** the API reads the public JSON calendar `jazzAmsterdam`.
- **Jazz in Amsterdam · Club:** the API reads the separate public JSON calendar `clubAmsterdam` and lists its events under Club.
- **Art Ahead:** the API reads the public RSS feed at `https://artahead.nl/feed.xml` and keeps ongoing/upcoming Amsterdam exhibitions.
- **Resident Advisor:** its Amsterdam listings page is linked; no permitted public API/feed was verified, so it remains link-only.

The page shows events returned by the connected public feeds; it has no demo events.
