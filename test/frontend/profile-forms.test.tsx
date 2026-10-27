import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import imageCompression from 'browser-image-compression';
import { httpsCallable } from 'firebase/functions';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import type { StorageError, UploadTaskSnapshot } from 'firebase/storage';
import { useAuth } from '../../src/auth/AuthProvider';
import { functions, storage } from '../../src/firebase_config';
import NewComitard from '../../src/sections/admin-account/new_comitard';
import EditComitard from '../../src/sections/admin-account/edit_comitard';

vi.mock('firebase/functions', () => ({ httpsCallable: vi.fn() }));
vi.mock('firebase/storage', () => ({ ref: vi.fn(), uploadBytesResumable: vi.fn(), getDownloadURL: vi.fn() }));
vi.mock('../../src/auth/AuthProvider', () => ({ useAuth: vi.fn() }));
vi.mock('browser-image-compression', () => ({ default: vi.fn() }));
// Icons fetch definitions over the network; keep the form controls real.
vi.mock('../../src/components/iconify/iconify', () => ({ default: () => null }));

type Mode = 'create' | 'edit';
type User = ReturnType<typeof userEvent.setup>;
type Edition = { id: string; data: () => { cercles: Record<string, {
  name: string; comitards: Record<string, typeof profile>;
}> } };
const theme = createTheme();
// Real MUI form interactions need headroom when the full suite runs in parallel.
const formTests = { timeout: 15_000 };
const originalPicture = 'https://example.test/original.jpg';
const uploadedPicture = 'https://example.test/uploaded.jpg';
const fields = {
  name: 'Dupont', firstname: 'Alice', nickname: 'Dudu', post: 'Présidente',
  teneurTaule: 0, etatCivil: 'Célibataire', age: 0, nbEtoiles: 0,
  pointFort: 'Organisation', pointFaible: 'Retards', estLeSeul: 'À tout prévoir',
  campus: 1, picture: originalPicture,
};
const profile = { ...fields, id: 'profile', cercle: 'Science', cercleId: 'member' };
const edition: Edition = {
  id: 'edition',
  data: () => ({ cercles: {
    member: { name: 'Science', comitards: { profile } },
    other: { name: 'Arts', comitards: {} },
  } }),
};
const save = Object.assign(vi.fn<(data: unknown) => Promise<{ data: unknown }>>(), { stream: vi.fn() });
const uploadedRef = { fullPath: 'edition/member/photo' };
const observeUpload = vi.fn();
const uploadTask = { on: observeUpload, snapshot: { ref: uploadedRef } };
const compressedFile = new File(['compressed image'], 'compressed.jpg', { type: 'image/jpeg' });

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.stubGlobal('URL', class extends URL {
    static createObjectURL = vi.fn(() => 'blob:profile-photo');
  });
  vi.mocked(useAuth).mockReturnValue({
    user: { uid: 'admin' } as NonNullable<ReturnType<typeof useAuth>['user']>,
    loading: false, isAdmin: () => true,
  });
  save.mockReset().mockResolvedValue({ data: { success: true } });
  observeUpload.mockReset().mockReturnValue(vi.fn());
  vi.mocked(httpsCallable).mockReturnValue(save);
  vi.mocked(ref).mockReturnValue(uploadedRef as ReturnType<typeof ref>);
  vi.mocked(uploadBytesResumable).mockReset().mockReturnValue(uploadTask as unknown as ReturnType<typeof uploadBytesResumable>);
  vi.mocked(getDownloadURL).mockReset().mockResolvedValue(uploadedPicture);
  vi.mocked(imageCompression).mockReset().mockResolvedValue(compressedFile);
});

afterEach(() => vi.unstubAllGlobals());

async function renderForm(mode: Mode, options: { admin?: boolean; values?: Partial<typeof profile>; data?: Edition } = {}) {
  const user = userEvent.setup();
  const refetchData = vi.fn();
  const close = vi.fn();
  const admin = options.admin ?? true;
  render(<ThemeProvider theme={theme}>
    {mode === 'create'
      ? <NewComitard data={options.data ?? edition} admin={admin} refetchData={refetchData} />
      : <EditComitard ComitardData={{ ...profile, ...options.values }} activeData={options.data ?? edition}
          admin={admin} refetchData={refetchData} close={close} />}
  </ThemeProvider>);
  if (mode === 'create') await user.click(screen.getByRole('button', { name: 'Créer nouveau comitard' }));
  const submit = () => screen.getByRole('button', { name: mode === 'create' ? 'Créer comitard' : 'Mettre à jour comitard' });
  return { user, refetchData, close, submit };
}

async function choose(user: User, helpText: string, option: string) {
  const control = screen.getByText(helpText).parentElement!.querySelector('button')!;
  await user.click(control);
  await user.click(await screen.findByRole('option', { name: option }));
}

async function selectPicture(user: User) {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
  await user.upload(input, new File(['image'], 'photo.jpg', { type: 'image/jpeg' }));
  await screen.findByRole('button', { name: 'Supprimer image' });
}

async function fillNewForm(user: User, options: { admin?: boolean; omit?: 'circle' | 'campus' | 'picture' } = {}) {
  for (const [label, value] of Object.entries({
    Nom: profile.name, Prénom: profile.firstname, Surnom: profile.nickname, Poste: profile.post,
    'État civil': profile.etatCivil, 'Point fort': profile.pointFort,
    'Point faible': profile.pointFaible, 'Est le seul': profile.estLeSeul,
  })) fireEvent.change(screen.getByLabelText(label), { target: { value } });
  for (const label of ['Teneur en taule du comitard', 'Age du comitard', "Nombre d'étoiles du comitard"]) {
    const input = screen.getByLabelText(label);
    await user.click(input);
    await user.type(input, '0');
    await user.tab();
  }
  if (options.admin !== false && options.omit !== 'circle') await choose(user, 'Cercle du comitard', 'Science');
  if (options.omit !== 'campus') await choose(user, 'Chaud changer de campus?', 'Possible');
  if (options.omit !== 'picture') await selectPicture(user);
}

async function completeUpload() {
  const complete = observeUpload.mock.calls.at(-1)![3] as () => void;
  await act(async () => complete());
}

async function prepareForm(mode: Mode, replacement = false) {
  const form = await renderForm(mode);
  if (mode === 'create') await fillNewForm(form.user);
  else if (replacement) {
    await form.user.click(screen.getByRole('button', { name: "Retirer l'image" }));
    await selectPicture(form.user);
  }
  return form;
}

describe('profile creation', formTests, () => {
  it('validates required fields before uploading or saving', async () => {
    const { user, submit, refetchData } = await renderForm('create');
    await user.click(submit());
    expect(screen.getByRole('alert')).toHaveTextContent('Certains champs sont incorrects');
    expect(screen.getByLabelText('Nom')).toHaveAttribute('aria-invalid', 'true');
    expect(submit()).toBeEnabled();
    expect(uploadBytesResumable).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
    expect(refetchData).not.toHaveBeenCalled();
  });

  it('uploads the compressed picture and waits for confirmation before clearing the form', async () => {
    const confirmation = deferred<{ data: unknown }>();
    save.mockReturnValue(confirmation.promise);
    const { user, submit, refetchData } = await renderForm('create');
    await fillNewForm(user);
    await user.click(submit());
    expect(uploadBytesResumable).toHaveBeenCalledWith(uploadedRef, compressedFile);
    expect(ref).toHaveBeenCalledWith(storage, expect.stringMatching(/^edition\/admin\/[\w-]+$/));
    expect(submit()).toBeDisabled();
    expect(save).not.toHaveBeenCalled();
    await completeUpload();
    expect(httpsCallable).toHaveBeenCalledWith(functions, 'addcomitard');
    expect(save).toHaveBeenCalledExactlyOnceWith({ ...fields, editionId: 'edition', cercle: 'member', picture: uploadedPicture });
    expect(refetchData).not.toHaveBeenCalled();
    expect(screen.queryByText('Comitard créé avec succès')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Nom')).toHaveValue(profile.name);
    expect(screen.getByRole('button', { name: 'Supprimer image' })).toBeInTheDocument();
    await act(async () => confirmation.resolve({ data: { success: true } }));
    expect(screen.getByRole('alert')).toHaveTextContent('Comitard créé avec succès');
    expect(refetchData).toHaveBeenCalledOnce();
    expect(screen.getByLabelText('Nom')).toHaveValue('');
    expect(screen.getByLabelText('Age du comitard')).toHaveValue('');
    expect(screen.getByLabelText('Teneur en taule du comitard')).toHaveValue('');
    expect(screen.getByLabelText("Nombre d'étoiles du comitard")).toHaveValue('');
    expect(screen.getAllByRole('combobox')).toHaveLength(2);
    for (const select of screen.getAllByRole('combobox')) expect(select).toHaveTextContent('Choisir une proportion');
    expect(screen.getByRole('button', { name: 'Click ou glisse une image ici' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Supprimer image' })).not.toBeInTheDocument();
    expect(submit()).toBeEnabled();
  });

  it.each(['circle', 'campus', 'picture'] as const)('requires a %s before uploading', async (omit) => {
    const { user, submit } = await renderForm('create');
    await fillNewForm(user, { omit });
    await user.click(submit());
    expect(screen.getByRole('alert')).toHaveTextContent('Certains champs sont incorrects');
    expect(submit()).toBeEnabled();
    expect(uploadBytesResumable).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it('lets ordinary members create profiles without choosing a circle', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'member' } as NonNullable<ReturnType<typeof useAuth>['user']>,
      loading: false, isAdmin: () => false,
    });
    const { user, submit, refetchData } = await renderForm('create', { admin: false });
    expect(screen.queryByText('Cercle du comitard')).not.toBeInTheDocument();
    await fillNewForm(user, { admin: false });
    await user.click(submit());
    expect(ref).toHaveBeenCalledWith(storage, expect.stringMatching(/^edition\/member\/[\w-]+$/));
    await completeUpload();
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ cercle: null, editionId: 'edition' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Comitard créé avec succès');
    expect(refetchData).toHaveBeenCalledOnce();
  });
});

describe('profile editing', formTests, () => {
  it('keeps the existing picture and numeric zero values until the save is confirmed', async () => {
    const confirmation = deferred<{ data: unknown }>();
    save.mockReturnValue(confirmation.promise);
    const { user, submit, refetchData, close } = await renderForm('edit');
    fireEvent.change(screen.getByLabelText('Surnom'), { target: { value: 'Nouveau surnom' } });
    await user.click(submit());
    expect(httpsCallable).toHaveBeenCalledWith(functions, 'editcomitard');
    expect(save).toHaveBeenCalledExactlyOnceWith({ ...fields, cercle: 'Science', cercleId: 'member',
      editionId: 'edition', comitardId: 'profile', nickname: 'Nouveau surnom' });
    expect(uploadBytesResumable).not.toHaveBeenCalled();
    expect(refetchData).not.toHaveBeenCalled();
    expect(submit()).toBeDisabled();
    await act(async () => confirmation.resolve({ data: { success: true } }));
    expect(screen.getByRole('alert')).toHaveTextContent('Comitard mis à jour avec succès');
    expect(refetchData).toHaveBeenCalledOnce();
    expect(close).not.toHaveBeenCalled();
    expect(submit()).toBeEnabled();
  });

  it('uploads a replacement into the owning circle and waits for its download URL before saving', async () => {
    const download = deferred<string>();
    vi.mocked(getDownloadURL).mockReturnValue(download.promise);
    const { user, submit, refetchData } = await prepareForm('edit', true);
    await user.click(submit());
    expect(ref).toHaveBeenCalledWith(storage, expect.stringMatching(/^edition\/member\/[\w-]+$/));
    expect(uploadBytesResumable).toHaveBeenCalledWith(uploadedRef, compressedFile);
    const progress = observeUpload.mock.calls[0][1] as (snapshot: UploadTaskSnapshot) => void;
    act(() => progress({ bytesTransferred: 25, totalBytes: 100, state: 'running' } as UploadTaskSnapshot));
    expect(screen.getByRole('button', { name: "En cours d'upload: 25.00%" })).toBeDisabled();
    await completeUpload();
    expect(getDownloadURL).toHaveBeenCalledWith(uploadedRef);
    expect(save).not.toHaveBeenCalled();
    expect(refetchData).not.toHaveBeenCalled();
    expect(submit()).toBeDisabled();
    await act(async () => download.resolve(uploadedPicture));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({
      editionId: 'edition', comitardId: 'profile', cercleId: 'member', picture: uploadedPicture,
    }));
    expect(refetchData).toHaveBeenCalledOnce();
    expect(screen.getByRole('alert')).toHaveTextContent('Comitard mis à jour avec succès');
    expect(submit()).toBeEnabled();
  });

  it('requires a replacement after removing the original picture', async () => {
    const { user, submit } = await renderForm('edit');
    await user.click(screen.getByRole('button', { name: "Retirer l'image" }));
    await user.click(submit());
    expect(screen.getByRole('alert')).toHaveTextContent('Certains champs sont incorrects');
    expect(submit()).toBeEnabled();
    expect(uploadBytesResumable).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it('rejects a missing campus before saving', async () => {
    const { user, submit } = await renderForm('edit', { values: { campus: 0 } });
    await user.click(submit());
    expect(screen.getByRole('alert')).toHaveTextContent('Certains champs sont incorrects');
    expect(save).not.toHaveBeenCalled();
    expect(submit()).toBeEnabled();
  });

  it('uses the owning circle ID when two circles have the same display name', async () => {
    const data: Edition = { id: 'edition', data: () => ({ cercles: {
      member: { name: 'Science', comitards: { profile } },
      other: { name: 'Science', comitards: {} },
    } }) };
    const { user, submit } = await renderForm('edit', { data });
    await user.click(submit());
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ cercleId: 'member' }));
  });

  it.each([false, true])('rejects a missing owning circle (replacement: %s)', async (replacement) => {
    const { user, submit, refetchData } = await renderForm('edit', { values: { id: 'missing-profile' } });
    if (replacement) {
      await user.click(screen.getByRole('button', { name: "Retirer l'image" }));
      await selectPicture(user);
    }
    await user.click(submit());
    expect(screen.getByRole('alert')).toHaveTextContent('Cercle non trouvé pour ce comitard');
    expect(submit()).toBeEnabled();
    expect(uploadBytesResumable).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
    expect(refetchData).not.toHaveBeenCalled();
  });

  it('lets ordinary members save their own profile', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'member' } as NonNullable<ReturnType<typeof useAuth>['user']>,
      loading: false, isAdmin: () => false,
    });
    const { user, submit, refetchData } = await renderForm('edit', { admin: false });
    await user.click(submit());
    expect(save).toHaveBeenCalledWith(expect.objectContaining({
      cercleId: 'member', comitardId: 'profile', picture: originalPicture,
    }));
    expect(refetchData).toHaveBeenCalledOnce();
    expect(screen.getByRole('alert')).toHaveTextContent('Comitard mis à jour avec succès');
  });

  it('cancels without submitting changes', async () => {
    const { user, close } = await renderForm('edit');
    await user.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(close).toHaveBeenCalledOnce();
    expect(save).not.toHaveBeenCalled();
    expect(uploadBytesResumable).not.toHaveBeenCalled();
  });
});

describe.each(['create', 'edit'] as const)('%s validation and upload recovery', formTests, (mode) => {
  it('rejects whitespace-only names before contacting Firebase', async () => {
    const { user, submit } = await prepareForm(mode);
    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: '   ' } });
    await user.click(submit());
    expect(screen.getByRole('alert')).toHaveTextContent('Certains champs sont incorrects');
    expect(screen.getByLabelText('Nom')).toHaveAttribute('aria-invalid', 'true');
    expect(submit()).toBeEnabled();
    expect(uploadBytesResumable).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it.each(['upload', 'download URL'])('preserves the form after a failed %s and allows a retry', async (stage) => {
    const { user, submit, refetchData } = await prepareForm(mode, true);
    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'À conserver' } });
    if (stage === 'download URL') vi.mocked(getDownloadURL).mockRejectedValueOnce(new Error('URL unavailable'));
    await user.click(submit());
    if (stage === 'upload') {
      const fail = observeUpload.mock.calls[0][2] as (error: StorageError) => void;
      await act(async () => fail(new Error('Upload unavailable') as StorageError));
    } else await completeUpload();
    expect(screen.getByRole('alert')).toHaveTextContent("Une erreur est survenue lors de l'upload de l'image");
    expect(screen.getByLabelText('Nom')).toHaveValue('À conserver');
    expect(screen.getByRole('button', { name: 'Supprimer image' })).toBeEnabled();
    expect(submit()).toBeEnabled();
    expect(save).not.toHaveBeenCalled();
    expect(refetchData).not.toHaveBeenCalled();
    await user.click(submit());
    await completeUpload();
    expect(uploadBytesResumable).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenCalledOnce();
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ name: 'À conserver' }));
    expect(refetchData).toHaveBeenCalledOnce();
    expect(screen.getByRole('alert')).toHaveTextContent(mode === 'create' ? 'Comitard créé avec succès' : 'Comitard mis à jour avec succès');
  });
});

describe.each([
  ['creation', 'create', true], ['editing', 'edit', false], ['editing with a new photo', 'edit', true],
] as const)('save confirmation during %s', formTests, (_label, mode, replacement) => {
  it.each([
    ['rejected request', () => Promise.reject(new Error('Server unavailable'))],
    ['negative acknowledgement', () => Promise.resolve({ data: { success: false } })],
    ['missing acknowledgement', () => Promise.resolve({ data: {} })],
  ])('keeps edits after a %s and succeeds on retry', async (_case, response) => {
    const { user, submit, refetchData, close } = await prepareForm(mode, replacement);
    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'À conserver' } });
    save.mockImplementationOnce(response);
    await user.click(submit());
    if (replacement) await completeUpload();
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Une erreur est survenue'));
    expect(screen.getByRole('alert')).not.toHaveTextContent('avec succès');
    expect(screen.getByLabelText('Nom')).toHaveValue('À conserver');
    expect(submit()).toBeEnabled();
    expect(refetchData).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
    await user.click(submit());
    if (replacement) await completeUpload();
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('avec succès'));
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'À conserver' }));
    expect(refetchData).toHaveBeenCalledOnce();
    expect(submit()).toBeEnabled();
  });
});
