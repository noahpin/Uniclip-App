// In /api/metadata/[url]/+server.ts
import { json } from '@sveltejs/kit';
import urlMetadata from 'url-metadata';

export async function GET({ params }) {
    const { url } = params;
    const decodedUrl = decodeURIComponent(url);

    try {
        const metadata = await urlMetadata(decodedUrl);
        
        return json({ metadata });
    } catch (error) {
        console.error('Error fetching metadata:', error);
        return json({ error: 'Failed to fetch metadata', status: 500 });
    }
};
