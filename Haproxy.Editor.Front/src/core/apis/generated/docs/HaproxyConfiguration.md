# HaproxyConfiguration

## Properties

| Name          | Type                                        | Description | Notes                  |
| ------------- | ------------------------------------------- | ----------- | ---------------------- |
| **raw**       | **string**                                  |             | [default to undefined] |
| **global**    | **Array&lt;string&gt;**                     |             | [default to undefined] |
| **defaults**  | **Array&lt;string&gt;**                     |             | [default to undefined] |
| **frontends** | **{ [key: string]: Array&lt;string&gt;; }** |             | [default to undefined] |
| **backends**  | **{ [key: string]: Array&lt;string&gt;; }** |             | [default to undefined] |

## Example

```typescript
import { HaproxyConfiguration } from "./api";

const instance: HaproxyConfiguration = {
	raw,
	global,
	defaults,
	frontends,
	backends,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
