# HaproxyConfiguration


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**global** | **Array&lt;string&gt;** |  | [optional] [default to undefined]
**defaults** | **Array&lt;string&gt;** |  | [optional] [default to undefined]
**frontends** | **{ [key: string]: Array&lt;string&gt;; }** |  | [optional] [default to undefined]
**backends** | **{ [key: string]: Array&lt;string&gt;; }** |  | [optional] [default to undefined]

## Example

```typescript
import { HaproxyConfiguration } from './api';

const instance: HaproxyConfiguration = {
    global,
    defaults,
    frontends,
    backends,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
