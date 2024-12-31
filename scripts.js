import fetch from 'node-fetch'; 
import { logger } from './logger.js';

async function coday(url, method, headers, payloadData = null, agent) {
    try {
        const options = {
            method,
            headers,
            agent, // Add the proxy agent here
        };
        if (payloadData) {
            options.body = JSON.stringify(payloadData);
        }
        const response = await fetch(url, options);
        const jsonData = await response.json().catch(() => ({}));

        if (!response.ok) {
            return { error: true, status: response.status, data: jsonData };
        }
        return jsonData;
    } catch (error) {
        logger(`Error in coday: ${error.message}`, 'error');
        return { error: true, message: error.message };
    }
}

// Main Logic for estimating, claiming, and starting rewards
async function estimate(id, headers, agent) {
    const url = 'https://api.meshchain.ai/meshmain/rewards/estimate';
    const result = await coday(url, 'POST', headers, { unique_id: id }, agent);
    if (result.status === 400){
      logger("Mine Not Start, Starting Mine...");
      await start(id, headers, agent);
    }
    return result || undefined;
}

async function claim(id, headers, agent) {
    const url = 'https://api.meshchain.ai/meshmain/rewards/claim';
    const result = await coday(url, 'POST', headers, { unique_id: id }, agent);

    return result.total_reward || null;
}

async function start(id, headers, agent) {
    const url = 'https://api.meshchain.ai/meshmain/rewards/start';
    const result = await coday(url, 'POST', headers, { unique_id: id }, agent);

    return result || null;
}

async function info(id, headers, agent) {
    const url = 'https://api.meshchain.ai/meshmain/nodes/status';
    const result = await coday(url, 'POST', headers, { unique_id: id }, agent);

    return result || null;
}

export { coday, estimate, claim, start, info };
