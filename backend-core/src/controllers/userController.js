import User from '../models/User.js';

// The oldest active PMO account is treated as a protected admin. It cannot
// be listed, fetched, modified, or deleted via the API. Its _id is resolved
// once and cached for the lifetime of the process.
let _protectedAdminId = null;

async function getProtectedAdminId() {
  if (_protectedAdminId) return _protectedAdminId;
  const admin = await User.findOne({ role: 'pmo', isActive: true }).sort({ createdAt: 1 }).select('_id');
  if (admin) _protectedAdminId = admin._id.toString();
  return _protectedAdminId;
}

async function isProtectedAdmin(id) {
  const adminId = await getProtectedAdminId();
  return adminId && id.toString() === adminId;
}

// POST /api/users — create a user. Password hashing happens in the User pre-save hook.
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });
    const user = await User.create({ name, email, password, role });
    res.status(201).json({ user: { id: user._id, name, email, role, isActive: user.isActive } });
  } catch (err) { next(err); }
};

// GET /api/users — optional filters: ?role=&isActive=. The protected admin is hidden.
export const listUsers = async (req, res, next) => {
  try {
    const adminId = await getProtectedAdminId();
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

    if (adminId) filter._id = { $ne: adminId };

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) { next(err); }
};

// GET /api/users/:id
export const getUser = async (req, res, next) => {
  try {
    if (await isProtectedAdmin(req.params.id))
      return res.status(403).json({ message: 'Access denied' });

    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) { next(err); }
};

// PUT /api/users/:id — supports name, email, role, isActive, password
export const updateUser = async (req, res, next) => {
  try {
    if (await isProtectedAdmin(req.params.id))
      return res.status(403).json({ message: 'The master PMO account cannot be modified' });

    const { name, email, role, isActive, password } = req.body;

    // When the password changes we must use save() so the pre-save hash hook
    // runs. findByIdAndUpdate would bypass the hook and store plaintext.
    if (password) {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      if (name !== undefined) user.name = name;
      if (email !== undefined) user.email = email;
      if (role !== undefined) user.role = role;
      if (isActive !== undefined) user.isActive = isActive;
      user.password = password;
      await user.save();
      const updated = await User.findById(user._id).select('-password');
      return res.json({ user: updated });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { ...(name !== undefined && { name }), ...(email !== undefined && { email }), ...(role !== undefined && { role }), ...(isActive !== undefined && { isActive }) },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) { next(err); }
};

// DELETE /api/users/:id — hard delete
export const deleteUser = async (req, res, next) => {
  try {
    if (await isProtectedAdmin(req.params.id))
      return res.status(403).json({ message: 'The master PMO account cannot be deleted' });

    const result = await User.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) { next(err); }
};
