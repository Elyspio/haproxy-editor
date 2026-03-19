# V1Api

All URIs are relative to _http://localhost_

| Method                                                    | HTTP request                          | Description |
| --------------------------------------------------------- | ------------------------------------- | ----------- |
| [**getHaproxyConfig**](#gethaproxyconfig)                 | **GET** /haproxy/config               |             |
| [**saveHaproxyConfig**](#savehaproxyconfig)               | **PUT** /haproxy/config               |             |
| [**validateHaproxyConfig**](#validatehaproxyconfig)       | **POST** /haproxy/config/validate     |             |
| [**validateHaproxyRawConfig**](#validatehaproxyrawconfig) | **POST** /haproxy/config/validate/raw |             |

# **getHaproxyConfig**

> HaproxyConfiguration getHaproxyConfig()

### Example

```typescript
import { V1Api, Configuration } from "./api";

const configuration = new Configuration();
const apiInstance = new V1Api(configuration);

const { status, data } = await apiInstance.getHaproxyConfig();
```

### Parameters

This endpoint does not have any parameters.

### Return type

**HaproxyConfiguration**

### Authorization

[Bearer](../README.md#Bearer)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     | OK          | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **saveHaproxyConfig**

> saveHaproxyConfig(haproxyConfiguration)

### Example

```typescript
import { V1Api, Configuration, HaproxyConfiguration } from "./api";

const configuration = new Configuration();
const apiInstance = new V1Api(configuration);

let haproxyConfiguration: HaproxyConfiguration; //

const { status, data } = await apiInstance.saveHaproxyConfig(haproxyConfiguration);
```

### Parameters

| Name                     | Type                     | Description | Notes |
| ------------------------ | ------------------------ | ----------- | ----- |
| **haproxyConfiguration** | **HaproxyConfiguration** |             |       |

### Return type

void (empty response body)

### Authorization

[Bearer](../README.md#Bearer)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: Not defined

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     | OK          | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **validateHaproxyConfig**

> validateHaproxyConfig(haproxyConfiguration)

### Example

```typescript
import { V1Api, Configuration, HaproxyConfiguration } from "./api";

const configuration = new Configuration();
const apiInstance = new V1Api(configuration);

let haproxyConfiguration: HaproxyConfiguration; //

const { status, data } = await apiInstance.validateHaproxyConfig(haproxyConfiguration);
```

### Parameters

| Name                     | Type                     | Description | Notes |
| ------------------------ | ------------------------ | ----------- | ----- |
| **haproxyConfiguration** | **HaproxyConfiguration** |             |       |

### Return type

void (empty response body)

### Authorization

[Bearer](../README.md#Bearer)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: Not defined

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     | OK          | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **validateHaproxyRawConfig**

> HaproxyConfiguration validateHaproxyRawConfig()

### Example

```typescript
import { V1Api, Configuration } from "./api";

const configuration = new Configuration();
const apiInstance = new V1Api(configuration);

let config: string; // (default to undefined)

const { status, data } = await apiInstance.validateHaproxyRawConfig(config);
```

### Parameters

| Name       | Type         | Description | Notes                 |
| ---------- | ------------ | ----------- | --------------------- |
| **config** | [**string**] |             | defaults to undefined |

### Return type

**HaproxyConfiguration**

### Authorization

[Bearer](../README.md#Bearer)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     | OK          | -                |
| **400**     | Bad Request | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)
