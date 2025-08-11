import {describe, expect, it} from 'vitest';
import {HaproxyConfigurationParser} from '../../src/core/services/parser.service';

const parser = new HaproxyConfigurationParser();

describe('HaproxyConfigurationParser', () => {
	describe('parseFrontends', () => {
		it('parses multiple frontends', () => {
			const conf = {
				frontend1: [
					'acl acl1 hdr(host) -i example.com',
					'use_backend backend1 if acl1'
				],
				frontend2: [
					'acl acl2 hdr(host) -i test.com',
					'use_backend backend2 if acl2'
				]
			};
			const result = parser.parseFrontends(conf);
			expect(result).toHaveLength(2);
			expect(result[0].name).toBe('frontend1');
			expect(result[1].name).toBe('frontend2');
		});
	});

	describe('parseFrontend', () => {
		it('parses a frontend with acl and mapping', () => {
			const lines = [
				'acl acl1 hdr(host) -i example.com',
				'use_backend backend1 if acl1'
			];
			const result = parser['parseFrontend']('frontend', lines);
			expect(result.name).toBe('frontend');
			expect(result.acls[0]).toMatchObject({name: 'acl1', activator: {host: 'example.com'}});
			expect(result.mappings[0]).toMatchObject({acl: 'acl1', backend: 'backend1'});
		});
	});

	describe('tryParseAcl', () => {
		it('parses valid acl line', () => {
			const line = 'acl acl1 hdr(host) -i example.com';
			const acl = parser['tryParseAcl'](line);
			expect(acl).toMatchObject({name: 'acl1', activator: {host: 'example.com'}});
		});
		it('returns false for invalid acl line', () => {
			expect(parser['tryParseAcl']('invalid line')).toBe(false);
		});
	});

	describe('tryParseMapping', () => {
		it('parses valid mapping line', () => {
			const line = 'use_backend backend1 if acl1';
			const mapping = parser['tryParseMapping'](line);
			expect(mapping).toMatchObject({acl: 'acl1', backend: 'backend1'});
		});
		it('returns false for invalid mapping line', () => {
			expect(parser['tryParseMapping']('invalid line')).toBe(false);
		});
	});

	describe('tryParseServer', () => {
		it('parses valid server line with port', () => {
			const line = 'server srv1 127.0.0.1:8080 check';
			const server = parser['tryParseServer'](line);
			expect(server).toMatchObject({name: 'srv1', host: '127.0.0.1', port: 8080, checked: true});
		});
		it('parses valid server line without port', () => {
			const line = 'server srv2 localhost check';
			const server = parser['tryParseServer'](line);
			expect(server).toMatchObject({name: 'srv2', host: 'localhost', port: 80, checked: true});
		});
		it('returns false for invalid server line', () => {
			expect(parser['tryParseServer']('invalid line')).toBe(false);
		});
	});


	describe('parseBackends', () => {
		it('parses multiple backends', () => {
			const conf = {
				backend1: [
					'server srv1 127.0.0.1:8080 check',
					'server srv2 localhost'
				],
				backend2: [
					'server srv3 192.168.1.1:9000 check'
				]
			};
			const result = parser.parseBackends(conf);
			expect(result).toHaveLength(2);
			expect(result[0].name).toBe('backend1');
			expect(result[1].name).toBe('backend2');
			expect(result[0].servers).toHaveLength(2);
			expect(result[1].servers).toHaveLength(1);
		});
	});

	describe('parseBackend', () => {
		it('parses backend with multiple servers', () => {
			const lines = [
				'server srv1 127.0.0.1:8080 check',
				'server srv2 localhost'
			];
			const result = parser['parseBackend']('backend', lines);
			expect(result.name).toBe('backend');
			expect(result.servers).toHaveLength(2);
			expect(result.servers[0]).toMatchObject({ name: 'srv1', host: '127.0.0.1', port: 8080, checked: true });
			expect(result.servers[1]).toMatchObject({ name: 'srv2', host: 'localhost', port: 80, checked: false });
		});

		it('filters out comments and empty lines', () => {
			const lines = [
				'',
				'# this is a comment',
				'server srv1 127.0.0.1:8080 check'
			];
			const result = parser['parseBackend']('backend', lines);
			expect(result.servers).toHaveLength(1);
			expect(result.servers[0]).toMatchObject({ name: 'srv1', host: '127.0.0.1', port: 8080, checked: true });
		});

		it('returns empty servers array if no valid server lines', () => {
			const lines = [
				'',
				'# comment',
				'not a server line'
			];
			const result = parser['parseBackend']('backend', lines);
			expect(result.servers).toHaveLength(0);
		});
	});
});
