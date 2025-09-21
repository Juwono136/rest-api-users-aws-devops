import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

export const sanitizeInput = (req, res, next) => {
    const sanitize = (data) => {
        if (typeof data === 'string') return DOMPurify.sanitize(data);
        if (typeof data === 'object' && data !== null) {
            for (const key in data) {
                data[key] = sanitize(data[key]);
            }
        }
        return data;
    };

    req.body = sanitize(req.body);
    req.query = sanitize(req.query);
    req.params = sanitize(req.params);

    next();
};
