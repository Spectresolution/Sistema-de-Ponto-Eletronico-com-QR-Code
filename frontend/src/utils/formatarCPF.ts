export default function formatarCPF(valor: string){

    const apenasNumeros = valor.replace(/\D/g, '');

    const cpf = apenasNumeros.slice(0,11);

    return cpf
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        .slice(0,14);
}