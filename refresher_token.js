import { coday, start } from './scripts.js';
import readline from 'readline/promises';
import fs from 'fs/promises';
import { logger } from './logger.js';
import { banner } from './banner.js';
import { solveAntiCaptcha, solve2Captcha } from './utils/solver.js';
const headers = { 'Content-Type': 'application/json' };

// Helper: Save data to a file
async function saveToFile(filename, data) {
    try {
        await fs.appendFile(filename, `${data}\n`, 'utf-8');
        logger(`Data saved to ${filename}`, 'success');
    } catch (error) {
        logger(`Failed to save data to ${filename}: ${error.message}`, 'error');
    }
}

// Captcha Solver
async function captchaSolver(type, apiKey) {
    return type === '2captcha' || type === '1'
        ? solve2Captcha(apiKey)
        : solveAntiCaptcha(apiKey);
}

// Login Function
async function login(typeKey, apiKey, email, password) {
    try {
        const payload = {
            captcha_token: await captchaSolver(typeKey, apiKey),
            email,
            password,
        };
        const response = await coday('https://api.meshchain.ai/meshmain/auth/email-signin', 'POST', headers, payload);
        if (response.access_token) {
            logger('Login successful!', 'success');
            return response;
        }
        throw new Error('Login failed. Check your credentials.');
    } catch (error) {
        logger(`Login error: ${error.message}`, 'error');
        throw error;
    }
}


// Main Function: Manage Mail and Registration
async function manageMailAndRegister() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    try {
        logger(banner, 'debug');
        const typeKey = await rl.question('Choose Captcha API (1: 2Captcha, 2: Anti-Captcha): ');
        const apiKey = await rl.question('API key? ');
        if (!apiKey) throw new Error('Invalid API key.');
        const data = await fs.readFile('accounts.txt', 'utf-8');
        const result = data.split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
          
          const [emailPart, passwordPart] = line.split(', ');
          const email = emailPart.split(': ')[1]; 
          const password = passwordPart.split(': ')[1]; 
  
          return { email, password };
        });  

        let i = 1;
        for (const item of result) {
            try {
                const loginData = await login(typeKey, apiKey, item.email, item.password);
                await saveToFile('re_token.txt', `${loginData.access_token}|${loginData.refresh_token}`);
                logger(`Account #${item.email} stt: ${i} created successfully.`, 'success');
                i++
            } catch (error) {
                logger(`Error with account #${item.email}: ${error.message}`, 'error');
                await saveToFile('re_token.txt', `manual refresh`);
            }
        }
    } catch (error) {
        logger(`Error: ${error.message}`, 'error');
    } finally {
        rl.close();
    }
}

manageMailAndRegister();
