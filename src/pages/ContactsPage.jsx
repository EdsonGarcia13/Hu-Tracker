// src/pages/ContactsPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import "./ContactsPage.css";

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

const normalizeText = (value) =>
  (value ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

function ContactForm({
  formData,
  isEditing,
  onChange,
  onSubmit,
  onCancel,
  disabled,
}) {
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
              disabled={disabled}
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
              disabled={disabled}
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
              disabled={disabled}
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
              disabled={disabled}
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
              disabled={disabled}
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
            <button type="submit" className="btn btn-save" disabled={disabled}>
              {isEditing ? "Actualizar contacto" : "Guardar contacto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContactsTable({
  filteredContacts,
  onEdit,
  onDelete,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  isFiltering,
  hasContacts,
  activeSearchTerm,
  disabled,
}) {
  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <div className="contacts-list-header">
          <h2 className="contacts-section-title">Contactos registrados</h2>
          <form
            className="contacts-search"
            onSubmit={onSearchSubmit}
            role="search"
          >
            <label
              className="visually-hidden"
              htmlFor="contacts-search-input"
            >
              Buscar contacto por nombre
            </label>
            <input
              id="contacts-search-input"
              type="search"
              className="form-control contacts-search-input"
              placeholder="Buscar por nombre"
              value={searchValue}
              onChange={onSearchChange}
              aria-label="Buscar contacto por nombre"
            />
            <button type="submit" className="btn contacts-search-button">
              Buscar
            </button>
          </form>
        </div>
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
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    {!hasContacts
                      ? "No hay contactos registrados todavía."
                      : isFiltering ? (
                          <>
                            No se encontraron contactos que coincidan con{" "}
                            <span className="fw-semibold">
                              “{activeSearchTerm}”
                            </span>
                            .
                          </>
                        ) : (
                          "No hay contactos registrados todavía."
                        )}
                  </td>
                </tr>
              ) : (
                filteredContacts.map(({ contact, index: originalIndex }) => (
                  <tr key={contact.id || `${contact.email}-${originalIndex}`}>
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
                          onClick={() => onEdit(originalIndex)}
                          disabled={disabled}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn-delete"
                          onClick={() => onDelete(originalIndex)}
                          disabled={disabled}
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
  const { user } = useSelector((s) => s.auth);
  const [contacts, setContacts] = useState([]);
  const [formData, setFormData] = useState(defaultFormState);
  const [editingIndex, setEditingIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [remoteError, setRemoteError] = useState("");

  const isEditing = editingIndex !== null;
  const canQuery = Boolean(supabase && isSupabaseConfigured && user?.id);

  const fetchContacts = useCallback(async () => {
    if (!canQuery) {
      setContacts([]);
      return;
    }
    setLoading(true);
    setRemoteError("");
    const { data, error } = await supabase
      .from("contacts")
      .select("id, name, team, role, email, cellphone")
      .eq("user_id", user.id)
      .order("inserted_at", { ascending: true });

    if (error) {
      setRemoteError(error.message);
      setContacts([]);
    } else {
      setContacts(data || []);
    }
    setLoading(false);
  }, [canQuery, user?.id]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(defaultFormState);
    setEditingIndex(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canQuery) {
      setRemoteError(
        "No es posible guardar contactos sin conexión con Supabase."
      );
      return;
    }

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

    setRemoteError("");

    if (editingIndex !== null) {
      const contact = contacts[editingIndex];
      if (!contact) return;
      const { data, error } = await supabase
        .from("contacts")
        .update(payload)
        .eq("id", contact.id)
        .eq("user_id", user.id)
        .select("id, name, team, role, email, cellphone")
        .single();

      if (error) {
        setRemoteError(error.message);
        return;
      }

      setContacts((prev) =>
        prev.map((item, index) => (index === editingIndex ? data : item))
      );
      resetForm();
      return;
    }

    const { data, error } = await supabase
      .from("contacts")
      .insert({ ...payload, user_id: user.id })
      .select("id, name, team, role, email, cellphone")
      .single();

    if (error) {
      setRemoteError(error.message);
      return;
    }

    setContacts((prev) => [...prev, data]);
    resetForm();
  };

  const handleEdit = (index) => {
    const contact = contacts[index];
    if (!contact) return;
    setFormData({
      name: contact.name,
      team: contact.team,
      role: contact.role,
      email: contact.email,
      cellphone: contact.cellphone.replace(/^52/, ""),
    });
    setEditingIndex(index);
  };

  const handleDelete = async (index) => {
    if (!canQuery) {
      setRemoteError(
        "No es posible eliminar contactos sin conexión con Supabase."
      );
      return;
    }

    const contact = contacts[index];
    if (!contact) return;

    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", contact.id)
      .eq("user_id", user.id);

    if (error) {
      setRemoteError(error.message);
      return;
    }

    setContacts((prev) => prev.filter((_, itemIndex) => itemIndex !== index));

    setEditingIndex((prevIndex) => {
      if (prevIndex === null) {
        return prevIndex;
      }
      if (prevIndex === index) {
        resetForm();
        return null;
      }
      if (prevIndex > index) {
        return prevIndex - 1;
      }
      return prevIndex;
    });
  };

  const handleSearchInputChange = (event) => {
    const { value } = event.target;
    setSearchQuery(value);
    if (value.trim() === "") {
      setSearchTerm("");
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmedQuery = searchQuery.trim();
    setSearchTerm(trimmedQuery);
    setSearchQuery(trimmedQuery);
  };

  const contactEntries = useMemo(
    () => contacts.map((contact, index) => ({ contact, index })),
    [contacts]
  );

  const normalizedSearchTerm = normalizeText(searchTerm);
  const filteredContacts =
    normalizedSearchTerm === ""
      ? contactEntries
      : contactEntries.filter(({ contact }) =>
          normalizeText(contact.name).includes(normalizedSearchTerm)
        );
  const isFiltering = normalizedSearchTerm !== "";

  const hasContacts = contacts.length > 0;

  return (
    <div className="contacts-page">
      <div className="container contacts-container">
        <div className="contacts-header">
          <h1 className="contacts-title fw-semibold">Contactos de Team Leads</h1>
          <p className="contacts-subtitle mb-0">
            Administra el directorio de contactos clave de tu organización.
          </p>
        </div>

        {remoteError && (
          <div className="alert alert-danger" role="alert">
            {remoteError}
          </div>
        )}
        {loading && (
          <div className="alert alert-info" role="status">
            Cargando contactos...
          </div>
        )}

        <div className="contacts-content">
          <section
            className="contacts-panel contacts-panel--form"
            aria-label="Formulario para agregar o editar contactos"
          >
            <ContactForm
              formData={formData}
              isEditing={isEditing}
              onChange={handleChange}
              onSubmit={handleSubmit}
              onCancel={resetForm}
              disabled={!canQuery}
            />
          </section>
          <section
            className="contacts-panel contacts-panel--list"
            aria-label="Listado de contactos registrados"
          >
            <ContactsTable
              filteredContacts={filteredContacts}
              onEdit={handleEdit}
              onDelete={handleDelete}
              searchValue={searchQuery}
              onSearchChange={handleSearchInputChange}
              onSearchSubmit={handleSearchSubmit}
              isFiltering={isFiltering}
              hasContacts={hasContacts}
              activeSearchTerm={searchTerm}
              disabled={!canQuery}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
