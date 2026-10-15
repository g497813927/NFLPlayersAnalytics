import { Col, Form, Input, Row } from 'antd';
import { requiredTextRules } from '../fieldTypes';

export function AthleteFields() {
  return (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="first_name" label="First name" rules={requiredTextRules}>
            <Input maxLength={80} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="last_name" label="Last name" rules={requiredTextRules}>
            <Input maxLength={80} />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="nationality" label="Nationality">
        <Input maxLength={80} />
      </Form.Item>
    </>
  );
}
