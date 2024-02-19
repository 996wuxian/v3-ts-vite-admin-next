// 定义装饰器，当不为登录时，访问对应的接口返回true
import { SetMetadata } from '@nestjs/common';

// controller使用
export const RequireLogin = () => SetMetadata('require-login', true);

// 当使用RequirePermission装饰器修饰一个控制器或处理程序方法时，它会将一个元数据键值对'require-permission'和权限数组``permissions作为值添加到该方法或控制器的元数据中。
// 接口使用
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata('require-permission', permissions);
