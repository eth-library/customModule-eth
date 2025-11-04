import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

@Pipe({
  name: 'safeTranslate',
  standalone: true,
  pure: false,
})
export class SafeTranslatePipe implements PipeTransform {

  constructor(private translate: TranslateService) {}

  transform(key: string): Observable<string> {
    return this.translate.stream(key);
  }

}

/*

Original TranslatePipe uses Angular’s inject() function internally:

private translate = inject(TranslateService);

inject() can only be called inside a valid injection context.
In Angular 18+, embedded views created by *ngIf, @if, @defer, or remote module boundaries may not have a fully initialized EnvironmentInjector yet.
Result: NG0203: inject() must be called from an injection context.

SafeTranslatePipe uses the classic constructor-based DI:

constructor(private translate: TranslateService) {}

The injector is guaranteed to provide the service when the component is instantiated, independent of block views or remote modules.
This avoids the NG0203 error entirely.

Observable support for language changes
SafeTranslatePipe returns translate.stream(key), an Observable.
Using | async in the template ensures that the translation updates automatically when the language changes.

pure: false
Marks the pipe as impure so Angular re-evaluates it each change detection cycle.
This ensures the Observable is subscribed correctly, reflecting dynamic changes in language or external state.

*/