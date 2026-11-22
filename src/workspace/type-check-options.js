export const typeCheckOptions = {
  exactOptionalPropertyTypes:
    "Exige declarar undefined en el tipo si se asigna a una propiedad opcional.",
  noUncheckedIndexedAccess:
    "Incluye undefined al leer índices cuya presencia no puede comprobar.",
  noPropertyAccessFromIndexSignature:
    "Exige corchetes al leer propiedades que solo admite una firma de índice.",
  noImplicitReturns:
    "Comprueba que una función que devuelve un valor lo haga en todos sus caminos.",
};

export function readTypeCheckOptions(value) {
  return Object.fromEntries(
    Object.keys(typeCheckOptions)
      .filter((key) => value?.[key] === true)
      .map((key) => [key, true]),
  );
}
