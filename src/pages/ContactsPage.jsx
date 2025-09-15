// src/pages/ContactsPage.jsx
import React, { useState } from "react";
import "./ContactsPage.css";

const initialContacts = [
  {
    name: "Ana López",
    team: "Frontend",
    role: "Technical Lead",
    email: "ana.lopez@example.com",
    cellphone: "5215551234567",
  },
  {
    name: "Carlos Méndez",
    team: "Backend",
    role: "Team Lead",
    email: "carlos.mendez@example.com",
    cellphone: "5215559876543",
  },
];

const defaultFormState = {
  name: "",
  team: "",
  role: "",
  email: "",
  cellphone: "",
};

const normalizePhone = (value) => {
  const digitsOnly = value.replace(/\D/g, "");
  if (!digitsOnly) {
    return "";
  }
  return digitsOnly.startsWith("52") ? digitsOnly : `52${digitsOnly}`;
};

const formatDisplayPhone = (value) => {
  const digitsOnly = value.replace(/\D/g, "");
  if (!digitsOnly) {
    return "";
  }
  const normalized = digitsOnly.startsWith("52") ? digitsOnly : `52${digitsOnly}`;
  const localNumber = normalized.slice(2);

  if (localNumber.length === 11) {
    const first = localNumber.slice(0, 1);
    const next = localNumber.slice(1, 4);
    const middle = localNumber.slice(4, 7);
    const last = localNumber.slice(7, 11);
    return `+52 ${first} ${next} ${middle} ${last}`;
  }

  if (localNumber.length === 10) {
    const area = localNumber.slice(0, 3);
    const middle = localNumber.slice(3, 6);
    const last = localNumber.slice(6, 10);
    return `+52 ${area} ${middle} ${last}`;
  }

  return `+${normalized}`;
};

function ContactForm({ formData, isEditing, onChange, onSubmit, onCancel }) {
  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <h2 className="contacts-section-title mb-4">
          {isEditing ? "Editar contacto" : "Agregar nuevo contacto"}
        </h2>
        <form className="row g-3 contacts-form" onSubmit={onSubmit}>
          <div className="col-md-6">
            <label htmlFor="name" className="form-label">
              Nombre
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="form-control"
              value={formData.name}
              onChange={onChange}
              placeholder="Ej. Ana López"
              required
            />
          </div>
          <div className="col-md-6">
            <label htmlFor="team" className="form-label">
              Equipo
            </label>
            <input
              id="team"
              name="team"
              type="text"
              className="form-control"
              value={formData.team}
              onChange={onChange}
              placeholder="Ej. Frontend"
              required
            />
          </div>
          <div className="col-md-6">
            <label htmlFor="role" className="form-label">
              Rol
            </label>
            <input
              id="role"
              name="role"
              type="text"
              className="form-control"
              value={formData.role}
              onChange={onChange}
              placeholder="Ej. Team Lead"
              required
            />
          </div>
          <div className="col-md-6">
            <label htmlFor="email" className="form-label">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-control"
              value={formData.email}
              onChange={onChange}
              placeholder="Ej. nombre@empresa.com"
              required
            />
          </div>
          <div className="col-md-6">
            <label htmlFor="cellphone" className="form-label">
              Celular (10 dígitos)
            </label>
            <input
              id="cellphone"
              name="cellphone"
              type="tel"
              className="form-control"
              value={formData.cellphone}
              onChange={onChange}
              placeholder="Ej. 5551234567"
              required
            />
          </div>
          <div className="col-12 d-flex justify-content-end gap-2">
            {isEditing && (
              <button
                type="button"
                className="btn btn-outline-secondary contacts-cancel"
                onClick={onCancel}
              >
                Cancelar
              </button>
            )}
            <button type="submit" className="btn btn-save">
              {isEditing ? "Actualizar contacto" : "Guardar contacto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContactsTable({ contacts, onEdit, onDelete }) {
  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <h2 className="contacts-section-title mb-4">Contactos registrados</h2>
        <div className="table-responsive">
          <table className="table align-middle contacts-table">
            <thead className="table-light">
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col">Equipo</th>
                <th scope="col">Rol</th>
                <th scope="col">Correo</th>
                <th scope="col">WhatsApp</th>
                <th scope="col" className="text-end">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {contacts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    No hay contactos registrados todavía.
                  </td>
                </tr>
              ) : (
                contacts.map((contact, index) => (
                  <tr key={`${contact.email}-${index}`}>
                    <td className="fw-semibold">{contact.name}</td>
                    <td>
                      <span className="contacts-team-badge">
                        {contact.team}
                      </span>
                    </td>
                    <td>{contact.role}</td>
                    <td>
                      <a
                        href={`mailto:${contact.email}`}
                        className="contact-email"
                      >
                        {contact.email}
                      </a>
                    </td>
                    <td>
                      <a
                        href={`https://wa.me/${contact.cellphone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="contact-whatsapp"
                      >
                        {formatDisplayPhone(contact.cellphone)}
                      </a>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end contacts-actions" role="group">
                        <button
                          type="button"
                          className="btn btn-edit"
                          onClick={() => onEdit(index)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn-delete"
                          onClick={() => onDelete(index)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState(initialContacts);
  const [formData, setFormData] = useState(defaultFormState);
  const [editingIndex, setEditingIndex] = useState(null);

  const isEditing = editingIndex !== null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(defaultFormState);
    setEditingIndex(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const normalizedPhone = normalizePhone(formData.cellphone);
    if (!normalizedPhone) {
      return;
    }

    const payload = {
      name: formData.name.trim(),
      team: formData.team.trim(),
      role: formData.role.trim(),
      email: formData.email.trim(),
      cellphone: normalizedPhone,
    };

    setContacts((prev) => {
      if (editingIndex !== null) {
        return prev.map((contact, index) =>
          index === editingIndex ? payload : contact,
        );
      }
      return [...prev, payload];
    });

    resetForm();
  };

  const handleEdit = (index) => {
    const contact = contacts[index];
    setFormData({
      name: contact.name,
      team: contact.team,
      role: contact.role,
      email: contact.email,
      cellphone: contact.cellphone.replace(/^52/, ""),
    });
    setEditingIndex(index);
  };

  const handleDelete = (index) => {
    setContacts((prev) => prev.filter((_, itemIndex) => itemIndex !== index));

    setEditingIndex((prevIndex) => {
      if (prevIndex === null) {
        return prevIndex;
      }
      if (prevIndex === index) {
        setFormData(defaultFormState);
        return null;
      }
      if (prevIndex > index) {
        return prevIndex - 1;
      }
      return prevIndex;
    });
  };

  return (
    <div className="contacts-page">
      <div className="container contacts-container">
        <div className="contacts-header">
          <h1 className="contacts-title fw-semibold">Contactos de Team Leads</h1>
          <p className="contacts-subtitle mb-0">
            Administra el directorio de contactos clave de tu organización.
          </p>
        </div>

        <div className="row g-4 contacts-content-row">
          <div className="col-12 col-xl-5 contacts-column">
            <ContactForm
              formData={formData}
              isEditing={isEditing}
              onChange={handleChange}
              onSubmit={handleSubmit}
              onCancel={resetForm}
            />
          </div>
          <div className="col-12 col-xl-7 contacts-column">
            <ContactsTable
              contacts={contacts}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
