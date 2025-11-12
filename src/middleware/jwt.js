import jwt from 'jsonwebtoken';

function authenticateToken(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(403).json({ message: "Token requerido" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Token inválido" });
        }
        req.user = user;
        next();
    });
}

export { authenticateToken };