import React, { useEffect } from "react";

const DEFAULT_METADATA = {
    title: "Kredibly - Your Personal AI Business Assistant on WhatsApp",
    description: "Kredibly is your Personal AI business assistant on WhatsApp. Create invoices, send payment requests, follow up customers, and get paid faster without spreadsheets.",
    image: "https://usekredibly.com/krediblyoriginal.jpeg",
    origin: "https://usekredibly.com"
};

const SEO = ({ title, description, path = "", ogImage, schema }) => {
    useEffect(() => {
        const fullUrl = `${DEFAULT_METADATA.origin}${path}`;
        const finalTitle = title ? `${title} | Kredibly` : DEFAULT_METADATA.title;
        const finalDesc = description || DEFAULT_METADATA.description;
        const finalImage = ogImage || DEFAULT_METADATA.image;

        // 1. Update Document Title
        document.title = finalTitle;

        // 2. Helper to get or create head meta tags
        const setMetaTag = (selector, attribute, value) => {
            let element = document.querySelector(selector);
            if (!element) {
                element = document.createElement("meta");
                if (selector.startsWith('meta[name=')) {
                    const name = selector.match(/name="([^"]+)"/)[1];
                    element.setAttribute("name", name);
                } else if (selector.startsWith('meta[property=')) {
                    const prop = selector.match(/property="([^"]+)"/)[1];
                    element.setAttribute("property", prop);
                }
                document.head.appendChild(element);
            }
            element.setAttribute(attribute, value);
        };

        // 3. Update Standard Meta Tags
        setMetaTag('meta[name="description"]', 'content', finalDesc);
        setMetaTag('meta[name="title"]', 'content', finalTitle);

        // 4. Update Open Graph (Facebook) Tags
        setMetaTag('meta[property="og:title"]', 'content', finalTitle);
        setMetaTag('meta[property="og:description"]', 'content', finalDesc);
        setMetaTag('meta[property="og:image"]', 'content', finalImage);
        setMetaTag('meta[property="og:url"]', 'content', fullUrl);

        // 5. Update Twitter Card Tags
        setMetaTag('meta[property="twitter:title"]', 'content', finalTitle);
        setMetaTag('meta[property="twitter:description"]', 'content', finalDesc);
        setMetaTag('meta[property="twitter:image"]', 'content', finalImage);
        setMetaTag('meta[property="twitter:url"]', 'content', fullUrl);

        // 6. Update Canonical Link
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement("link");
            canonical.setAttribute("rel", "canonical");
            document.head.appendChild(canonical);
        }
        canonical.setAttribute("href", fullUrl);

        // 7. Inject Page-Specific JSON-LD Schema (if provided)
        let schemaScript = document.getElementById("page-seo-schema");
        if (schemaScript) schemaScript.remove();

        if (schema) {
            schemaScript = document.createElement("script");
            schemaScript.id = "page-seo-schema";
            schemaScript.type = "application/ld+json";
            schemaScript.text = JSON.stringify(schema);
            document.head.appendChild(schemaScript);
        }

        // Clean up schema on unmount to prevent page pollution
        return () => {
            const scriptToRemove = document.getElementById("page-seo-schema");
            if (scriptToRemove) scriptToRemove.remove();
        };
    }, [title, description, path, ogImage, schema]);

    return null; // Side-effect only component
};

export default SEO;
