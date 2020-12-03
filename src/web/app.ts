import express from 'express';
import cookieParser from 'cookie-parser';
import getConfig from '../config';
import deploy from '../deploy/deploy';
import isValidPayload from './isValidPayload';

function getApp() {
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    app.post(getConfig().path || '/', (req, res) => {
        if (!req.body) {
            res.status(400).end('Payload empty');
            return;
        }
        const repositoryURL = req.body.repository?.url;
        if (!repositoryURL) {
            res.status(400).end('Invalid Payload');
            return;
        }
        const repo = getConfig().repositories[repositoryURL];
        if (!repo) {
            res.status(404).end('Repository not found');
            return;
        }
        const event = req.header('x-github-event');
        if (!event) {
            res.status(400).end('No event listed');
            return;
        }
        if (event !== 'push') {
            res.status(400).end('Event is not push');
            return;
        }
        try {
            const secret = repo.secret || getConfig().secret;
            if (secret) {
                const signature = req.header('x-hub-signature-256');
                if (!signature) {
                    res.status(400).end('Request is not signed');
                    return;
                }
                if (!isValidPayload(req.body, secret, signature)) {
                    res.status(400).end('Signature did not match');
                    return;
                }
            }
            res.status(200).end('Ok');
            deploy(repositoryURL, repo);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
            res.status(500).end('Unknown error occurred');
        }
    });
    return app;
}

export default getApp;
