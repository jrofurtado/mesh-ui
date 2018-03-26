import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { IModalDialog } from 'gentics-ui-core';
import { SafeUrl, SafeScript } from '@angular/platform-browser';
import {
    trigger,
    state,
    style,
    animate,
    transition
  } from '@angular/animations';

import { BlobService } from '../../providers/blob.service';
import { ApplicationStateService } from '../../../state/providers/application-state.service';
import { Schema, SchemaField } from '../../../common/models/schema.model';
import { MeshNode, BinaryField } from '../../../common/models/node.model';
import { initializeNode } from '../../common/initialize-node';
import { EditorEffectsService } from '../../providers/editor-effects.service';
import { ListEffectsService } from '../../../core/providers/effects/list-effects.service';
import { EntitiesService } from '../../../state/providers/entities.service';

interface FileWithBlob {
    file: BinaryField;
    blob: SafeUrl;
    progress: 'none' | 'uploading' | 'done' | 'error';
    mediaType: string;
}
@Component({
    selector: 'mesh-multi-file-upload-dialog',
    templateUrl: './multi-file-upload-dialog.component.html',
    styleUrls: ['./multi-file-upload-dialog.component.scss'],
    animations: [
        trigger('overlayVisible', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('100ms')
            ]),
            transition(':leave', [
                animate('100ms', style({ opacity: 0 }))
            ]),
        ])
    ]
})
export class MultiFileUploadDialogComponent implements IModalDialog, OnInit {
    @ViewChild('fileInput') fileInput: ElementRef;

    closeFn: (val: any) => void;
    cancelFn: (val: any) => void;

    files: File[]; // Initialy passed from the dialog opener. Afterwards filesWithBlobs will be used
    parentUuid: string;
    language: string;
    project: string;

    // We cache the blobs of images/videos/audios so it does not get rerendered everytime.
    private filesWithBlobs: FileWithBlob[];
    public availableSchemas: Schema[] = []; // Public because spec needs to access it.

    private selectedSchema: Schema = null;
    private selectedField: SchemaField = null;
    private schemaFields: SchemaField[] = [];

    private isSaving = false;

    constructor(
        private blobService: BlobService,
        private state: ApplicationStateService,
        private editorEffects: EditorEffectsService,
        private listEffects: ListEffectsService,
        private entitiesService: EntitiesService,
    ) { }

    ngOnInit() {
        this.state.select(state => state.entities.schema)
        .take(1)
        .subscribe((schemas) => {
            Object.keys(schemas).forEach(key => {
                const schema = this.entitiesService.getSchema(key);

                const schemaBinaryFields = schema.fields.filter(field => field.type === 'binary');
                if (schemaBinaryFields.length > 0) {
                    // Only pick the schemas where one or less binaries are required.
                    if (schemaBinaryFields.filter(field => field.required === true).length <= 1) {
                        // Only pick the schemas where there are no non-binary required fields
                        if (schema.fields.some(field => field.type !== 'binary' && field.required === true) === false) {
                            this.availableSchemas.push(schema);
                        }
                    }
                }
            });
        });

        this.filesWithBlobs = this.files.map(file => this.addBlobToFile(file));
    }

    registerCloseFn(close: (val: any) => void): void {
        this.closeFn = close;
    }

    registerCancelFn(cancel: (val: any) => void): void {
        this.cancelFn = cancel;
    }

    save(): void {
        this.isSaving = true;
        const progress = this.filesWithBlobs.map<Promise<void | MeshNode>>(fileWithBlobs => {
            fileWithBlobs.progress = 'uploading';

            const node = initializeNode(this.selectedSchema, this.parentUuid, this.language);
            node.fields[this.selectedField.name] = fileWithBlobs.file;
            return this.editorEffects.saveNewNode(this.project, node as MeshNode, null)
                .then(response => {
                    fileWithBlobs.progress = 'done';
                    return response;
                }).catch(error => {
                    fileWithBlobs.progress = 'error';
                    throw error;
                });
        });

        Promise.all(progress).then((results) => {
            this.listEffects.loadChildren(this.project, this.parentUuid, this.language);
            this.closeFn(true);
        }).catch(error => {
            // Remove the uploaded files. The failed ones will have an indicator displayed.
            this.filesWithBlobs = this.filesWithBlobs.filter(fileWitBlob => fileWitBlob.progress !== 'done');
            this.isSaving = false;
            this.listEffects.loadChildren(this.project, this.parentUuid, this.language);
        });
    }

    onDropFiles(files: File[]) {
        files = files.filter(droppedFile => // Filter out the duplicates by filename and the filesize.
            this.filesWithBlobs.some(filesWithBlob =>
                /* filesWithBlob.file.fileSize === droppedFile.size && */ // Files can be checked by the size as well if you need more uniquesness
                filesWithBlob.file.fileName === droppedFile.name) === false);

        this.filesWithBlobs = [...this.filesWithBlobs, ...files.map(file => this.addBlobToFile(file))];
    }

    onFileInputChanged () {
        this.onDropFiles(Array.from(this.fileInput.nativeElement.files));
    }

    addBlobToFile(file: File): FileWithBlob {
        return {
            file: { fileName: file.name, fileSize: file.size, mimeType: file.type, file } as BinaryField,
            blob: this.blobService.createObjectURL(file),
            mediaType: this.getBinaryMediaType(file),
            progress: 'none'
        };
    }

    onFileRemoved(fileToRemove: FileWithBlob) {
        this.filesWithBlobs = this.filesWithBlobs.filter(file => file !== fileToRemove);
    }

    onSchemaChange(schema: Schema) {
        this.selectedSchema = schema;

        // If we have a required binary field - take it and ignore the others.
        if (this.selectedSchema.fields.filter(field => field.type === 'binary' && field.required === true).length > 0) {
            this.schemaFields =  this.selectedSchema.fields.filter(field => field.type === 'binary' && field.required === true);
        } else { // Take all binary fields
            this.schemaFields =  this.selectedSchema.fields.filter(field => field.type === 'binary');
        }
    }

    onFieldSelected(field: SchemaField) {
        this.selectedField = field;
    }

    private getBinaryMediaType(file: File): string {
        const mimeType: string = file.type;
        if (!mimeType) {
            return null;
        }
        const type = (mimeType.split('/')[0] as string).toLowerCase();
        return type;
    }
}
