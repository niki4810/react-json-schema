/* global jasmine, beforeEach, describe, it, expect, fail, spyOn */

import React from 'react';
import ReactJsonSchema from '../lib/ReactJsonSchema';

let reactJsonSchema;
let schema;

export default describe('ReactJsonSchema', () => {
  const Tester = React.createClass({
    render: () => {
      return React.createElement('h1', null, 'Tester!!!!');
    }
  });

  beforeEach(() => {
    reactJsonSchema = new ReactJsonSchema();
    schema = {
      'component': Tester,
      'someProp': 'I\'m a tester'
    };
  });
  describe('when parsing schema', () => {
    it('should return an array of React elements when schema\'s root type is of type array.', () => {
      const actual = reactJsonSchema.parseSchema([schema]);
      expect(Array.isArray(actual)).toBe(true);
      const component = actual[0];
      expect(React.isValidElement(<component />)).toBe(true);
    });
    it('should return a root React element when the schema\'s root type is of type object.', () => {
      const actual = reactJsonSchema.parseSchema(schema);
      expect(actual === Object(actual)).toBe(true);
    });
  });
  describe('when parsing sub-schemas', () => {
    it('should return an empty array when no schemas are passed as an argument.', () => {
      const actual = reactJsonSchema.parseSubSchemas();
      expect(Array.isArray(actual)).toBe(true);
    });
    it('should return an array of React elements when valid schemas are passed as an argument.', () => {
      const subSchemas = [schema, schema];
      const actual = reactJsonSchema.parseSubSchemas(subSchemas);
      expect(!!actual.length).toBe(true);
      expect(actual[0] === Object(actual[0])).toBe(true);
    });
    it('should construct sub-schema React elements by parsing each sub-schema.', () => {
      const subSchemas = [schema, schema];
      spyOn(reactJsonSchema, 'parseSchema');
      reactJsonSchema.parseSubSchemas(subSchemas);
      expect(reactJsonSchema.parseSchema).toHaveBeenCalled();
    });
    it('should assign a key to the current sub-schema based on the current sub-schema\'s index to meet React\'s key expectation of multiple React elements.', () => {
      spyOn(reactJsonSchema, 'parseSchema');
      const schemaClone = Object.assign({}, schema);
      reactJsonSchema.parseSubSchemas([schemaClone]);
      schemaClone.key = 0;
      expect(reactJsonSchema.parseSchema).toHaveBeenCalledWith(schemaClone);
    });
  });
  describe('when creating components', () => {
    it('should throw an error when no schema is passed as an argument.', () => {
      spyOn(reactJsonSchema, 'resolveComponent');
      spyOn(reactJsonSchema, 'resolveComponentChildren');
      reactJsonSchema.resolveComponent.and.returnValue(null);
      reactJsonSchema.resolveComponentChildren.and.returnValue(null);
      expect(reactJsonSchema.createComponent).toThrowError();
    });
    it('should create a React element.', () => {
      const actual = reactJsonSchema.createComponent(schema);
      expect(React.isValidElement(<actual />)).toBe(true);
    });
    it('should resolve and pass props (schema key value pair not described by component or children) and child elements to React\'s create element functionality.', () => {
      const largeSchema = Object.assign({}, schema);
      largeSchema.children = [schema];
      spyOn(React, 'createElement');
      reactJsonSchema.createComponent(largeSchema);
      expect(React.createElement).toHaveBeenCalledWith(jasmine.any(Function), { someProp: schema.someProp }, jasmine.any(Array));
    });
  });
  describe('when resolving components (evaluting schema for mapping requirements)', () => {
    it('should throw an error when a schema element does not have a component attribute.', () => {
      expect(reactJsonSchema.resolveComponent).toThrowError();
    });
    it('should resolve components defined as strings against a component map.', () => {
      const stringSchema = { component: 'Tester' };
      reactJsonSchema.setComponentMap({ Tester });
      const actual = reactJsonSchema.resolveComponent(stringSchema);
      expect(React.isValidElement(<actual />)).toBe(true);
    });
    it('should resolve components defined as components without a component map.', () => {
      reactJsonSchema.setComponentMap({}); // a little unecessary, but to paint the picture
      const actual = reactJsonSchema.resolveComponent(schema);
      expect(React.isValidElement(<actual />)).toBe(true);
    });
    it('should resolve native HTML tags.', () => {
      spyOn(React, 'createElement');
      const stringSchema = { component: 'h1' };
      reactJsonSchema.parseSchema(stringSchema);
      expect(React.createElement).toHaveBeenCalledWith(stringSchema.component, jasmine.any(Object), jasmine.any(Array));
    });
  });
  describe('when resolving component children', () => {
    it('should resolve text before resolving child components.', () => {
      spyOn(React, 'createElement');
      spyOn(reactJsonSchema, 'resolveComponentChildren');
      const stringSchema = { component: 'h1', text: 'Hello World' };
      reactJsonSchema.parseSchema(stringSchema);
      expect(React.createElement).toHaveBeenCalledWith(jasmine.any(String), jasmine.any(Object), stringSchema.text);
      expect(reactJsonSchema.resolveComponentChildren).not.toHaveBeenCalled();
    });
    it('should return an empty array if no child components are present.', () => {
      const actual = reactJsonSchema.resolveComponentChildren(schema);
      expect(Array.isArray(actual)).toBe(true);
      expect(!!actual.length).toBe(false);
    });
    it('should return an array with child components if the children attribute is defined by valid sub-schemas.', () => {
      const largeSchema = Object.assign({}, schema);
      largeSchema.children = [schema];
      const actual = reactJsonSchema.resolveComponentChildren(largeSchema);
      expect(Array.isArray(actual)).toBe(true);
      expect(!!actual.length).toBe(true);
    });
  });
});
