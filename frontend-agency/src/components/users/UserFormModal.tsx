import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { FormField, Input, Select } from "../ui/Form";
import AvatarPicker, { AVATARS } from "../ui/AvatarPicker";
import { DatePicker } from "../sales/forms/TicketForm";
import { User } from "../../types";
import { capitalizeName, todayStr } from "../../utils/formatters";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingUser: User | null;
  onSave: (formData: any) => Promise<void>;
  documentTypes: any[];
  existingUsers: User[];
  triggerError: (msg: string) => void;
}

export default function UserFormModal({
  isOpen,
  onClose,
  editingUser,
  onSave,
  documentTypes,
  existingUsers,
  triggerError,
}: UserFormModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "asesor" as "admin" | "asesor" | "freelancer",
    docType: "CC",
    docNumber: "",
    phone: "",
    birthDate: "",
    status: "active" as "active" | "inactive",
    avatar: AVATARS[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingUser) {
      const nameParts = editingUser.name.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      setFormData({
        firstName,
        lastName,
        email: editingUser.email,
        password: editingUser.password || "",
        role: editingUser.role as "admin" | "asesor" | "freelancer",
        docType: editingUser.docType || "CC",
        docNumber: editingUser.docNumber || "",
        phone: editingUser.phone || "",
        birthDate: editingUser.birthDate || "",
        status: editingUser.status as "active" | "inactive",
        avatar: editingUser.avatar || AVATARS[0],
      });
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "asesor",
        docType: documentTypes?.[0]?.abreviatura || "CC",
        docNumber: "",
        phone: "",
        birthDate: "",
        status: "active",
        avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      });
    }
    setErrors({});
    setShowPassword(false);
  }, [editingUser, isOpen, documentTypes]);

  const validateField = (name: string, value: string) => {
    let errorMsg = "";
    switch (name) {
      case "firstName":
        if (!value.trim()) errorMsg = "El nombre es obligatorio";
        else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value))
          errorMsg = "El nombre solo debe contener letras";
        else if (value.length > 40)
          errorMsg = "El nombre no puede exceder 40 caracteres";
        break;
      case "lastName":
        if (!value.trim()) errorMsg = "El apellido es obligatorio";
        else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value))
          errorMsg = "El apellido solo debe contener letras";
        else if (value.length > 40)
          errorMsg = "El apellido no puede exceder 40 caracteres";
        break;
      case "email":
        if (!value.trim()) errorMsg = "El correo es obligatorio";
        else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value))
          errorMsg = "El correo no es valido";
        else if (value.length > 40)
          errorMsg = "El correo no puede exceder 40 caracteres";
        
        if (!errorMsg) {
          const isDuplicateEmail = existingUsers.some(
            (u) =>
              u.email.toLowerCase() === value.toLowerCase() &&
              (!editingUser || u.id !== editingUser.id),
          );
          if (isDuplicateEmail) errorMsg = "Este correo ya esta registrado";
        }
        break;
      case "password":
        if (!editingUser && !value.trim()) {
          errorMsg = "La contraseña es obligatoria";
        }
        break;
      case "docType":
        if (!value) errorMsg = "Seleccione un tipo de documento";
        break;
      case "docNumber":
        if (!value.trim()) {
          errorMsg = "El número de documento es obligatorio";
        } else {
          const typeUpper = formData.docType ? formData.docType.toUpperCase() : "";
          if (typeUpper === "PASAPORTE" || typeUpper === "PP" || typeUpper === "PAS") {
            if (value.length < 9 || value.length > 12) {
              errorMsg = "El pasaporte debe tener entre 9 y 12 caracteres";
            } else if (!/^[a-zA-Z0-9]+$/.test(value)) {
              errorMsg = "El pasaporte solo debe contener caracteres alfanuméricos";
            }
          } else if (typeUpper === "NIT" || typeUpper === "RUT") {
            if (value.length !== 11) {
              errorMsg = "El NIT/RUT debe tener exactamente 11 caracteres (9 dígitos + guion + 1 dígito)";
            } else if (!/^\d{9}-\d{1}$/.test(value)) {
              errorMsg = "El NIT/RUT debe tener formato 9 dígitos - guion - 1 dígito de verificación (ej: 123456789-0)";
            }
          } else if (typeUpper === "CC") {
            if (value.length < 8 || value.length > 10) {
              errorMsg = "La cédula de ciudadanía debe tener entre 8 y 10 dígitos";
            } else if (!/^\d+$/.test(value)) {
              errorMsg = "La cédula de ciudadanía solo debe contener números";
            }
          } else if (value.length > 15) {
            errorMsg = "El documento no puede exceder 15 caracteres";
          }
        }

        if (!errorMsg) {
          const isDuplicateDoc = existingUsers.some(
            (u) =>
              u.docNumber === value &&
              (!editingUser || u.id !== editingUser.id),
          );
          if (isDuplicateDoc) errorMsg = "Este numero de documento ya esta registrado";
        }
        break;
      case "phone":
        if (!value.trim()) errorMsg = "El telefono es obligatorio";
        else if (!/^\d+$/.test(value))
          errorMsg = "El telefono solo debe contener numeros";
        else if (value.length > 15)
          errorMsg = "El telefono no puede exceder 15 caracteres";
        break;
      case "birthDate":
        if (!value) {
          errorMsg = "La fecha de nacimiento es obligatoria";
        } else {
          const selectedDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (selectedDate > today) {
            errorMsg = "La fecha de nacimiento no puede ser superior a la fecha actual";
          }
        }
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
    if (errorMsg) {
      triggerError(errorMsg);
    }
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim())
      newErrors.firstName = "El nombre es obligatorio";
    else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.firstName))
      newErrors.firstName = "El nombre solo debe contener letras";
    else if (formData.firstName.length > 40)
      newErrors.firstName = "El nombre no puede exceder 40 caracteres";

    if (!formData.lastName.trim())
      newErrors.lastName = "El apellido es obligatorio";
    else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.lastName))
      newErrors.lastName = "El apellido solo debe contener letras";
    else if (formData.lastName.length > 40)
      newErrors.lastName = "El apellido no puede exceder 40 caracteres";

    if (!formData.email.trim()) newErrors.email = "El correo es obligatorio";
    else if (
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)
    )
      newErrors.email = "El correo no es valido";
    else if (formData.email.length > 40)
      newErrors.email = "El correo no puede exceder 40 caracteres";

    if (!editingUser && !formData.password.trim())
      newErrors.password = "La contraseña es obligatoria";

    if (!formData.docType) {
      newErrors.docType = "Seleccione un tipo de documento";
    }

    if (!formData.docNumber.trim()) {
      newErrors.docNumber = "El número de documento es obligatorio";
    } else {
      const typeUpper = formData.docType ? formData.docType.toUpperCase() : "";
      if (typeUpper === "PASAPORTE" || typeUpper === "PP" || typeUpper === "PAS") {
        if (formData.docNumber.length < 9 || formData.docNumber.length > 12) {
          newErrors.docNumber = "El pasaporte debe tener entre 9 y 12 caracteres";
        } else if (!/^[a-zA-Z0-9]+$/.test(formData.docNumber)) {
          newErrors.docNumber = "El pasaporte solo debe contener caracteres alfanuméricos";
        }
      } else if (typeUpper === "NIT" || typeUpper === "RUT") {
        if (formData.docNumber.length !== 11) {
          newErrors.docNumber = "El NIT/RUT debe tener exactamente 11 caracteres (9 dígitos + guion + 1 dígito)";
        } else if (!/^\d{9}-\d{1}$/.test(formData.docNumber)) {
          newErrors.docNumber = "El NIT/RUT debe tener formato 9 dígitos - guion - 1 dígito de verificación (ej: 123456789-0)";
        }
      } else if (typeUpper === "CC") {
        if (formData.docNumber.length < 8 || formData.docNumber.length > 10) {
          newErrors.docNumber = "La cédula de ciudadanía debe tener entre 8 y 10 dígitos";
        } else if (!/^\d+$/.test(formData.docNumber)) {
          newErrors.docNumber = "La cédula de ciudadanía solo debe contener números";
        }
      } else if (formData.docNumber.length > 15) {
        newErrors.docNumber = "El documento no puede exceder 15 caracteres";
      }
    }

    if (!formData.phone.trim()) newErrors.phone = "El telefono es obligatorio";
    else if (!/^\d+$/.test(formData.phone))
      newErrors.phone = "El telefono solo debe contener numeros";
    else if (formData.phone.length > 15)
      newErrors.phone = "El telefono no puede exceder 15 caracteres";

    if (!formData.birthDate)
      newErrors.birthDate = "La fecha de nacimiento es obligatoria";

    const isDuplicateEmail = existingUsers.some(
      (u) =>
        u.email.toLowerCase() === formData.email.toLowerCase() &&
        (!editingUser || u.id !== editingUser.id),
    );
    if (isDuplicateEmail) newErrors.email = "Este correo ya esta registrado";

    const isDuplicateDoc = existingUsers.some(
      (u) =>
        u.docNumber === formData.docNumber &&
        (!editingUser || u.id !== editingUser.id),
    );
    if (isDuplicateDoc)
      newErrors.docNumber = "Este numero de documento ya esta registrado";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstError = Object.values(newErrors)[0];
      triggerError(firstError);
      return;
    }

    setErrors({});
    setIsSaving(true);
    try {
      const sanitizedData = {
        ...formData,
        firstName: capitalizeName(formData.firstName),
        lastName: capitalizeName(formData.lastName),
        name: `${capitalizeName(formData.firstName)} ${capitalizeName(formData.lastName)}`.trim(),
      };
      await onSave(sanitizedData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingUser ? "Editar Usuario" : "Nuevo Usuario"}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </>
      }
    >
      <AvatarPicker
        value={formData.avatar}
        onChange={(avatar) => setFormData({ ...formData, avatar })}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Nombres" error={errors.firstName}>
          <Input
            maxLength={40}
            value={formData.firstName}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
              setFormData({ ...formData, firstName: cleaned });
              if (errors.firstName) setErrors((p) => ({ ...p, firstName: "" }));
            }}
            onBlur={(e) => validateField("firstName", e.target.value)}
          />
        </FormField>
        <FormField label="Apellidos" error={errors.lastName}>
          <Input
            maxLength={40}
            value={formData.lastName}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
              setFormData({ ...formData, lastName: cleaned });
              if (errors.lastName) setErrors((p) => ({ ...p, lastName: "" }));
            }}
            onBlur={(e) => validateField("lastName", e.target.value)}
          />
        </FormField>
        <FormField label="Correo" error={errors.email}>
          <Input
            maxLength={40}
            type="email"
            value={formData.email}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/\s/g, "").toLowerCase();
              setFormData({ ...formData, email: cleaned });
              if (errors.email) setErrors((p) => ({ ...p, email: "" }));
            }}
            onBlur={(e) => validateField("email", e.target.value)}
          />
        </FormField>
        <FormField label="Contraseña" error={errors.password}>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                if (errors.password) setErrors((p) => ({ ...p, password: "" }));
              }}
              onBlur={(e) => validateField("password", e.target.value)}
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </FormField>
        <FormField label="Rol">
          <Select
            value={formData.role}
            onChange={(e) =>
              setFormData({
                ...formData,
                role: e.target.value as "admin" | "asesor" | "freelancer",
              })
            }
            options={[
              { value: "admin", label: "Administrador" },
              { value: "asesor", label: "Asesor" },
              { value: "freelancer", label: "Freelancer" },
            ]}
          />
        </FormField>
        <FormField label="Tipo Doc" error={errors.docType}>
          <Select
            value={formData.docType}
            onChange={(e) => {
              setFormData({ ...formData, docType: e.target.value });
              if (errors.docType) setErrors((p) => ({ ...p, docType: "" }));
              validateField("docType", e.target.value);
            }}
            options={[
              { value: "", label: "Seleccione" },
              ...(documentTypes || []).map((d: any) => ({
                value: d.abreviatura,
                label: d.abreviatura,
              })),
            ]}
            error={errors.docType}
          />
        </FormField>
        <FormField label="Documento" error={errors.docNumber}>
          <Input
            value={formData.docNumber}
            onChange={(e) => {
              let val = e.target.value;
              const typeUpper = formData.docType ? formData.docType.toUpperCase() : "";
              if (typeUpper === "CC") {
                val = val.replace(/\D/g, "");
              } else if (typeUpper === "PASAPORTE" || typeUpper === "PP" || typeUpper === "PAS") {
                val = val.replace(/[^a-zA-Z0-9]/g, "");
              } else if (typeUpper === "NIT" || typeUpper === "RUT") {
                val = val.replace(/[^0-9-]/g, "");
              } else {
                val = val.replace(/[^\w-]/gi, "");
              }
              setFormData({ ...formData, docNumber: val });
              if (errors.docNumber) setErrors((p) => ({ ...p, docNumber: "" }));
            }}
            onBlur={(e) => validateField("docNumber", e.target.value)}
            maxLength={
              formData.docType ? (
                formData.docType.toUpperCase() === "CC" ? 10 :
                ["PASAPORTE", "PP", "PAS"].includes(formData.docType.toUpperCase()) ? 12 :
                ["NIT", "RUT"].includes(formData.docType.toUpperCase()) ? 11 : 15
              ) : 15
            }
            error={errors.docNumber}
          />
        </FormField>
        <FormField label="Teléfono" error={errors.phone}>
          <Input
            maxLength={15}
            value={formData.phone}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/\D/g, "").slice(0, 15);
              setFormData({ ...formData, phone: cleaned });
              if (errors.phone) setErrors((p) => ({ ...p, phone: "" }));
            }}
            onBlur={(e) => validateField("phone", e.target.value)}
          />
        </FormField>
        <FormField label="Fecha Nacimiento" error={errors.birthDate}>
          <DatePicker
            value={formData.birthDate}
            onChange={(val) => {
              setFormData({ ...formData, birthDate: val });
              if (errors.birthDate) setErrors((p) => ({ ...p, birthDate: "" }));
              validateField("birthDate", val);
            }}
            max={todayStr()}
            fieldName="Nacimiento del usuario"
            popoverDirection="up"
            triggerError={triggerError}
          />
        </FormField>
        <FormField label="Estado">
          <Select
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as "active" | "inactive",
              })
            }
            options={[
              { value: "active", label: "Activo" },
              { value: "inactive", label: "Inactivo" },
            ]}
          />
        </FormField>
      </div>
    </Modal>
  );
}
