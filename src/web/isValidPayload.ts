import crypto from "crypto";

export default function isValidPayload(payload: any, secret: string, signature: string) {
    // based off of https://gist.github.com/stigok/57d075c1cf2a609cb758898c0b202428
    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from(
        `sha256=${hmac.update(JSON.stringify(payload)).digest('hex')}`,
        'utf8'
    );
    const checksum = Buffer.from(signature);
    return (
        checksum.length === digest.length &&
        crypto.timingSafeEqual(digest, checksum)
    );
}
