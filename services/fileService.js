import fs from 'fs/promises';

const deleteFile = async (filePath) => {
    try {
        await fs.unlink(filePath);
    } catch (err) {
        if (err.code !== 'ENOENT') {
            throw err;
        }
    }
};

export { deleteFile };