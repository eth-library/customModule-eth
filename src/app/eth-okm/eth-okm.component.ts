import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Observable, of, switchMap } from 'rxjs';
import { EthStoreService } from 'src/app/services/eth-store.service';

@Component({
  selector: 'custom-eth-okm',
  templateUrl: './eth-okm.component.html',
  styleUrls: ['./eth-okm.component.scss'],
  standalone: true,   
  imports: [
    CommonModule
  ]    
})
export class EthOKMComponent implements OnInit {
  searchValue$!: Observable<string | null>;

  constructor(private ethStoreService: EthStoreService) {}

  ngOnInit(): void {

    this.searchValue$ = this.ethStoreService.isFullview$().pipe(
      switchMap(isFullview => 
        !isFullview 
          ? this.ethStoreService.searchValue$
          : of(null)
      )
    )

  }

  encode(value: string | null): string {
    return value ? encodeURIComponent(value) : '';
  }
    
}
