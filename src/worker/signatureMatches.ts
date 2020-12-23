import crypto from 'crypto';

export default function signatureMatches(
    payload: any,
    secret: string,
    signature: string
) {
    // based off of https://gist.github.com/stigok/57d075c1cf2a609cb758898c0b202428
    const hmac = crypto.createHmac('sha256', secret);
    const a = `sha256=${hmac.update(JSON.stringify(payload)).digest('hex')}`;
    const digest = Buffer.from(a, 'utf8');
    const checksum = Buffer.from(signature);
    return (
        checksum.length === digest.length &&
        crypto.timingSafeEqual(digest, checksum)
    );
}
