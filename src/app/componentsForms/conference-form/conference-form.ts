
import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConferenceService } from '../../services/conference-service';
import { Router, ActivatedRoute } from '@angular/router';
import { Conference } from '../../models/conference';

@Component({
  selector: 'app-conference-form',
  imports: [ReactiveFormsModule],
  templateUrl: './conference-form.html',
  styleUrl: './conference-form.css',
})
export class ConferenceForm {
  private conferenceServ = inject(ConferenceService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  editingId = signal<number | null>(null);

  myForm: FormGroup = new FormGroup({
    title: new FormControl('', [Validators.required, Validators.minLength(3)]),
    description: new FormControl('', Validators.required),
    place: new FormControl(''),
    nbmax: new FormControl(''),
    date: new FormControl(''),
  });
//update here
  myFormValue = toSignal(this.myForm.valueChanges, { initialValue: this.myForm.value });

  isValid = toSignal(this.myForm.statusChanges, { initialValue: 'INVALID' });

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        const numId = Number(id);
        this.editingId.set(numId);
        this.conferenceServ.getConferenceById(numId).subscribe({
          next: (conf) => {
            this.myForm.patchValue({
              title: conf.title,
              description: conf.description,
              place: conf.place,
              nbmax: conf.maxParticipants,
              date: conf.date,
            });
          },
          error: (err) => console.error('Erreur lors du chargement :', err),
        });
      } else {
        this.editingId.set(null);
        this.myForm.reset();
      }
    });

    effect(() => {
      console.log(this.myFormValue());
      console.log(this.isValid());
    });
  }

  onSubmit() {
    const conf: Conference = {
      id: this.editingId() ?? 0,
      title: this.myForm.value.title ?? '',
      description: this.myForm.value.description ?? '',
      date: this.myForm.value.date ?? '',
      place: this.myForm.value.place ?? '',
      maxParticipants: Number(this.myForm.value.nbmax) || 0,
      nbParticipants: 0,
    };

    const request$ = this.editingId()
      ? this.conferenceServ.updateConference(this.editingId() as number, conf)
      : this.conferenceServ.addConference(conf);

    request$.subscribe({
      next: (response) => {
        console.log('Succes, conference enregistree :', response);
      },
      error: (err) => {
        console.error('Erreur lors de la requete :', err);
      },
      complete: () => {
        console.log('Flux termine (la requete HTTP est completement finie)');
        this.router.navigate(['/conferences']);
      },
    });
  }
}
