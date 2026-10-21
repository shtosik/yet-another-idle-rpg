import { Pipe, PipeTransform } from '@angular/core';
import i18next from 'i18next';

@Pipe({
    name: 'i18next',
    pure: false,
})
export class I18nextPipe implements PipeTransform {
    transform(key: string, options?: any) {
        return i18next.t(key, options);
    }
}
