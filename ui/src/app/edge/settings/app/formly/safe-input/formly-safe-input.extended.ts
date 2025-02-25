import { Component, OnInit } from "@angular/core";
import { ModalController } from "@ionic/angular";
import { FieldWrapper, FormlyFieldConfig } from "@ngx-formly/core";
import { FormlySafeInputModalComponent } from "./formly-safe-input-modal.component";
import { GetAppAssistant } from "../../jsonrpc/getAppAssistant";
import { OptionGroupConfig } from "../option-group-picker/optionGroupPickerConfiguration";

@Component({
    selector: 'formly-safe-input-wrapper',
    templateUrl: './formly-safe-input.extended.html'
})
export class FormlySafeInputWrapperComponent extends FieldWrapper implements OnInit {

    protected pathToDisplayValue: string;
    protected displayType: 'string' | 'boolean' | 'number' | 'optionGroup';

    constructor(
        private modalController: ModalController
    ) {
        super();
    }

    ngOnInit(): void {
        this.pathToDisplayValue = this.props["pathToDisplayValue"];
        this.displayType = this.props["displayType"] ?? 'string';
    }

    protected onSelectItem() {
        this.formControl.markAsTouched();
        this.openModal();
    }

    /**
     * Opens the model to select the option.
     */
    private async openModal() {
        const modal = await this.modalController.create({
            component: FormlySafeInputModalComponent,
            componentProps: {
                title: this.props.label,
                fields: this.getFields(),
                model: this.model
            },
            cssClass: ['auto-height']
        });
        modal.onDidDismiss().then(event => {
            if (!event.data) {
                // nothing selected
                return;
            }

            const finalModel = { ...this.form.getRawValue(), ...event.data };
            for (const [key, value] of Object.entries(finalModel)) {
                this.model[key] = value;
            }

            // set values with current form value when the fields are set via fieldGroup 
            // to make sure every value gets set accordingly to the object hierarchy
            if (this.field.fieldGroup) {
                this.form.setValue(this.form.getRawValue());
            } else {
                this.form.setValue(this.model);
            }
            this.formControl.markAsDirty();
        });
        return await modal.present();
    }

    public getValue() {
        if (this.displayType === 'boolean'
            || this.displayType === 'number'
            || this.displayType === 'string') {
            return this.model[this.pathToDisplayValue];
        }

        if (this.displayType === 'optionGroup') {
            const value = this.getValueOfOptionGroup();
            if (value) {
                return value;
            }
        }

        // not defined
        return this.model[this.pathToDisplayValue];
    }

    private getValueOfOptionGroup(): string {
        const field = GetAppAssistant.findField(this.getFields(), this.pathToDisplayValue.split('.'));
        if (!field) {
            return null;
        }
        const option = ((field.templateOptions ?? field.props).options as OptionGroupConfig[]).map(optionGroup => optionGroup.options)
            .reduce((acc, val) => acc.concat(val), [])
            .find(option => option.value === this.model[this.pathToDisplayValue]);
        if (!option) {
            return null;
        }
        return option.expressions?.title?.(this.field) ?? option.title ?? option.value;
    }


    private getFields(): FormlyFieldConfig[] {
        // @Deprecated rather set this#props.fields
        if (this.field.fieldGroup) {
            return this.field.fieldGroup;
        }
        if (this.props.fields) {
            return this.props.fields;
        }
        return [];
    }

}
