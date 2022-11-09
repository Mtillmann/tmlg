
import {defineStore} from 'pinia'

export const useGlobalStore = defineStore('globalStore', {
    state: () => {



        return {
            toasts: [],
            loading: false,
            defaultDate : null,
            upperDate : null,
            lowerDate : null
        }
    },
    // could also be defined as
    // state: () => ({ count: 0 })
    actions: {
        toast(title: string, body: string, duration: number = 2000): void {
            this.toasts.push({
                // @ts-ignore
                title, body
            });

            setTimeout(() => {
                this.toasts.shift();
            }, duration);
        },
        toggleLoading(): void {
            this.loading = !this.loading
        },
        setLoading(value: boolean = true) {
            this.loading = value;
        }
    },
})