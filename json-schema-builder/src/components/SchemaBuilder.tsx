import React, { useState } from 'react';
import { Button, Card, Input, Select, Switch } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';


const { Option } = Select;

type FieldType = 'string' | 'number' | 'nested' | 'objectId' | 'float' | 'boolean' | 'array';

interface Field {
  id: string;
  key: string;
  type: FieldType;
  required: boolean;
  children?: Field[];
}

const defaultField = (): Field => ({
  id: crypto.randomUUID(),
  key: '',
  type: 'string',
  required: false,
});

const renderDefaultValue = (type: FieldType) => {
  switch (type) {
    case 'string':
      return "STRING";
    case 'number':
      return "number";
    case 'objectId':
      return "ObjectId";
    case 'float':
      return "float";
    case 'boolean':
      return "boolean";
    case 'array':
      return '[]';
    case 'nested':
      return '{}';
    default:
      return "";
  }
};

const SchemaRow: React.FC<{
  field: Field;
  onChange: (id: string, updated: Partial<Field>) => void;
  onAdd: (parentId: string) => void;
  onDelete: (id: string) => void;
  nested?: boolean;
}> = ({ field, onChange, onAdd, onDelete, nested = false }) => {
  return (
    <div className={`row ${nested ? 'nested' : ''}`}>      
      <Input
        value={field.key}
        onChange={(e) => onChange(field.id, { key: e.target.value })}
        placeholder="field name"
        style={{ width: '20%' }}
      />
      <Select
        value={field.type}
        onChange={(value) => onChange(field.id, { type: value })}
        style={{ width: '20%' }}
      >
        <Option value="string">string</Option>
        <Option value="number">number</Option>
        <Option value="float">float</Option>
        <Option value="boolean">boolean</Option>
        <Option value="objectId">objectId</Option>
        <Option value="array">array</Option>
        <Option value="nested">nested</Option>
      </Select>
      <Switch
        checked={field.required}
        onChange={(checked) => onChange(field.id, { required: checked })}
      />
      <Button icon={<DeleteOutlined />} onClick={() => onDelete(field.id)} danger />
      {field.type === 'nested' && (
        <div style={{ marginLeft: '2rem' }}>
          {(field.children || []).map((child) => (
            <SchemaRow
              key={child.id}
              field={child}
              onChange={(cid, data) => {
                const updatedChildren = field.children?.map((c) =>
                  c.id === cid ? { ...c, ...data } : c
                );
                onChange(field.id, { children: updatedChildren });
              }}
              onAdd={onAdd}
              onDelete={(cid) => {
                const updatedChildren = field.children?.filter((c) => c.id !== cid);
                onChange(field.id, { children: updatedChildren });
              }}
              nested
            />
          ))}
          <Button icon={<PlusOutlined />} onClick={() => onAdd(field.id)}>
            Add Nested Field
          </Button>
        </div>
      )}
    </div>
  );
};

export const SchemaBuilder: React.FC = () => {
  const [fields, setFields] = useState<Field[]>([]);

  const updateField = (id: string, updated: Partial<Field>) => {
    const update = (items: Field[]): Field[] =>
      items.map((item) => {
        if (item.id === id) return { ...item, ...updated };
        if (item.type === 'nested' && item.children) {
          return { ...item, children: update(item.children) };
        }
        return item;
      });

    setFields((prev) => update(prev));
  };

  const addField = (parentId?: string) => {
    const newField = defaultField();

    if (!parentId) {
      setFields([...fields, newField]);
    } else {
      const update = (items: Field[]): Field[] =>
        items.map((item) => {
          if (item.id === parentId) {
            const updatedChildren = [...(item.children || []), defaultField()];
            return { ...item, children: updatedChildren };
          } else if (item.type === 'nested' && item.children) {
            return { ...item, children: update(item.children) };
          }
          return item;
        });

      setFields((prev) => update(prev));
    }
  };

  const deleteField = (id: string) => {
    const filter = (items: Field[]): Field[] =>
      items
        .filter((item) => item.id !== id)
        .map((item) =>
          item.type === 'nested' && item.children
            ? { ...item, children: filter(item.children) }
            : item
        );

    setFields((prev) => filter(prev));
  };

  const generateJSON = (fields: Field[]) => {
    const obj: Record<string, any> = {};
    for (let field of fields) {
      if (field.type === 'nested' && field.children) {
        obj[field.key] = generateJSON(field.children);
      } else {
        obj[field.key] = renderDefaultValue(field.type);
      }
    }
    return obj;
  };

  return (
    <Card style={{ margin: 20 }}>
      {fields.map((field) => (
        <SchemaRow
          key={field.id}
          field={field}
          onChange={updateField}
          onAdd={addField}
          onDelete={deleteField}
        />
      ))}
      <Button icon={<PlusOutlined />} onClick={() => addField()}>
        Add Field
      </Button>
      <h3>JSON Output:</h3>
      <pre>{JSON.stringify(generateJSON(fields), null, 2)}</pre>
    </Card>
  );
};
