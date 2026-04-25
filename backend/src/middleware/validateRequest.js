const validateRequest = (rules) => {
  return (req, res, next) => {
    const missing = [];
    for (const [field, condition] of Object.entries(rules)) {
      const value = req.body[field] || req.query[field];
      if (!value && condition.required) {
        missing.push(field);
      }
    }
    if (missing.length > 0) {
      return res.status(400).json({ success: false, error: `Missing required fields: ${missing.join(', ')}` });
    }
    next();
  };
};

module.exports = validateRequest;