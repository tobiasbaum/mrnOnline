import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Pipe({
  name: 'isSafeUrl'
})
export class IsSafeUrlPipe implements PipeTransform {

  constructor(private san: DomSanitizer) {
  }

  transform(value: string, ...args: unknown[]): SafeUrl {
    return this.san.bypassSecurityTrustUrl(value);
  }

}
