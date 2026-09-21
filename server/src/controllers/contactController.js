const Contact = require('../models/Contact');
const ApiResponse = require('../utils/apiResponse');
const { toE164, isValidPhone } = require('../utils/phoneValidator');
const { parseCSV, toCSV } = require('../utils/csvHelper');

exports.createContact = async (req, res, next) => {
  try {
    const { name, phoneNumber, email, company, tags, notes, status } = req.body;

    const normalizedPhone = toE164(phoneNumber);
    if (!isValidPhone(normalizedPhone)) {
      return ApiResponse.error(res, { message: 'Invalid phone number format', statusCode: 400 });
    }

    const contact = await Contact.create({
      userId: req.userId,
      name,
      phoneNumber: normalizedPhone,
      email,
      company,
      tags: tags || [],
      notes,
      status,
    });

    return ApiResponse.success(res, { message: 'Contact created', data: contact, statusCode: 201 });
  } catch (error) {
    next(error);
  }
};

exports.getContacts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, tag } = req.query;
    const query = { userId: req.userId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) query.status = status;
    if (tag) query.tags = tag;

    const total = await Contact.countDocuments(query);
    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return ApiResponse.paginated(res, { data: contacts, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    next(error);
  }
};

exports.getContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOne({ _id: req.params.id, userId: req.userId });
    if (!contact) {
      return ApiResponse.error(res, { message: 'Contact not found', statusCode: 404 });
    }
    return ApiResponse.success(res, { data: contact });
  } catch (error) {
    next(error);
  }
};

exports.updateContact = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (updates.phoneNumber) {
      const normalizedPhone = toE164(updates.phoneNumber);
      if (!isValidPhone(normalizedPhone)) {
        return ApiResponse.error(res, { message: 'Invalid phone number format', statusCode: 400 });
      }
      updates.phoneNumber = normalizedPhone;
    }

    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updates,
      { new: true, runValidators: true }
    );
    if (!contact) {
      return ApiResponse.error(res, { message: 'Contact not found', statusCode: 404 });
    }
    return ApiResponse.success(res, { message: 'Contact updated', data: contact });
  } catch (error) {
    next(error);
  }
};

exports.deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!contact) {
      return ApiResponse.error(res, { message: 'Contact not found', statusCode: 404 });
    }
    return ApiResponse.success(res, { message: 'Contact deleted' });
  } catch (error) {
    next(error);
  }
};

exports.importContacts = async (req, res, next) => {
  try {
    if (!req.file) {
      return ApiResponse.error(res, { message: 'CSV file is required', statusCode: 400 });
    }

    const records = await parseCSV(req.file.buffer);
    const contacts = [];
    const errors = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const phone = toE164(record.phoneNumber || record.phone || record.Phone);
      if (!phone || !isValidPhone(phone)) {
        errors.push({ row: i + 1, error: 'Invalid phone number', data: record });
        continue;
      }
      contacts.push({
        userId: req.userId,
        name: record.name || record.Name || `Contact ${i + 1}`,
        phoneNumber: phone,
        email: record.email || record.Email || '',
        company: record.company || record.Company || '',
        tags: (record.tags || record.Tags || '').split(',').map((t) => t.trim()).filter(Boolean),
        notes: record.notes || record.Notes || '',
      });
    }

    let created = [];
    if (contacts.length) {
      created = await Contact.insertMany(contacts, { ordered: false });
    }

    return ApiResponse.success(res, {
      message: `${created.length} contacts imported`,
      data: { imported: created.length, errors },
      statusCode: 201,
    });
  } catch (error) {
    next(error);
  }
};

exports.exportContacts = async (req, res, next) => {
  try {
    const contacts = await Contact.find({ userId: req.userId }).sort({ createdAt: -1 });
    const csv = toCSV(
      contacts.map((c) => ({
        name: c.name,
        phoneNumber: c.phoneNumber,
        email: c.email,
        company: c.company,
        tags: c.tags.join(', '),
        notes: c.notes,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
      })),
      ['name', 'phoneNumber', 'email', 'company', 'tags', 'notes', 'status', 'createdAt']
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=contacts.csv');
    return res.send(csv);
  } catch (error) {
    next(error);
  }
};
